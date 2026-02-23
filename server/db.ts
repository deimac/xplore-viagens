// Função para obter resumo dos cômodos e total de camas
export async function getRoomsSummaryAndBeds(propertyId: number) {
  // Resumo dos cômodos
  // Resumo dos cômodos com total de camas por tipo
  const roomsSummaryRaw = await executeQuery(
    `SELECT
        rt.name AS name,
        rt.icon AS icon,
        COUNT(DISTINCT pr.id) AS total_spaces,
        COALESCE(SUM(prb.quantity), 0) AS total_beds
     FROM property_rooms pr
     JOIN room_types rt ON rt.id = pr.room_type_id
     LEFT JOIN room_beds prb ON prb.room_id = pr.id
     WHERE pr.property_id = ?
     GROUP BY rt.id, rt.name, rt.icon
     ORDER BY rt.name`,
    [propertyId]
  );
  const roomsSummary = roomsSummaryRaw.map((r: any) => ({
    name: r.name,
    icon: r.icon,
    total: r.total_spaces,
    beds: r.total_beds
  }));

  // Total de camas geral
  const totalBeds = roomsSummary.reduce((acc: number, r: any) => acc + (Number(r.beds) || 0), 0);

  return {
    rooms_summary: roomsSummary,
    total_beds: totalBeds,
  };
}
import { eq, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { InsertUser, users, travels, InsertTravel, categories, InsertCategory, travelCategories, quotations, InsertQuotation, companySettings, InsertCompanySettings, heroSlides, InsertHeroSlide, reviewAuthors, reviews, InsertReviewAuthor, InsertReview, ofertasVoo, ofertasDatasFixas, ofertasDatasFlexiveis } from "../drizzle/schema";
import { ENV } from './_core/env';
// import { geocodeAddress, buildAddressString } from './_core/map';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

async function executeQuery<T = any>(query: string, params: any[] = [], timeout: number = 10000): Promise<T> {
  if (!_pool) {
    await getDb();
    if (!_pool) throw new Error("Database not available");
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Query timeout after ${timeout}ms: ${query.slice(0, 100)}...`));
    }, timeout);

    _pool!.execute(query, params, (err, results) => {
      clearTimeout(timer);
      if (err) {
        console.error(`[Database Error] ${err.message}`, { query: query.slice(0, 100), params });
        reject(err);
      } else {
        resolve(results as T);
      }
    });
  });
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Travels queries
export async function getAllTravels() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      travel: travels,
      category: categories,
    })
    .from(travels)
    .leftJoin(travelCategories, eq(travels.id, travelCategories.travelId))
    .leftJoin(categories, eq(travelCategories.categoryId, categories.id));

  // Group travels with their categories
  const travelsMap = new Map();
  result.forEach((row) => {
    if (!travelsMap.has(row.travel.id)) {
      travelsMap.set(row.travel.id, {
        ...row.travel,
        categories: [],
      });
    }
    if (row.category) {
      travelsMap.get(row.travel.id).categories.push(row.category);
    }
  });

  // Filter out past travels (only show future trips)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  const futureTravels = Array.from(travelsMap.values()).filter((travel) => {
    if (!travel.departureDate) return true; // Keep if no date
    // Parse DD/MM/AAAA format
    const parts = travel.departureDate.split('/');
    if (parts.length !== 3) return true; // Keep if invalid format
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    const departureDate = new Date(year, month, day);
    return departureDate > today; // Only future trips, not today
  });
  return futureTravels;
}

export async function getTravelById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      travel: travels,
      category: categories,
    })
    .from(travels)
    .leftJoin(travelCategories, eq(travels.id, travelCategories.travelId))
    .leftJoin(categories, eq(travelCategories.categoryId, categories.id))
    .where(eq(travels.id, id));

  if (result.length === 0) return null;

  const travel = {
    ...result[0].travel,
    categories: result.filter((r) => r.category).map((r) => r.category!),
  };

  return travel;
}

export async function createTravel(travel: InsertTravel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(travels).values(travel);
  return result;
}

export async function updateTravel(id: number, travel: Partial<InsertTravel>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(travels).set(travel).where(eq(travels.id, id));
}

export async function deleteTravel(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(travels).where(eq(travels.id, id));
}

// Categories queries
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories);
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(category);
  return result;
}

export async function updateCategory(id: number, category: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(category).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ==========================================
// NEW Viagens / Categorias / Destaques queries
// ==========================================

/** Normalizes a MySQL DATE (Date object or string) to 'YYYY-MM-DD' or null */
function normalizeDateColumn(d: any): string | null {
  if (!d) return null;
  if (d instanceof Date && !isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  if (typeof d === 'string') {
    const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return null;
}

function parseViagensRows(rows: any[]) {
  return rows.map((row: any) => ({
    ...row,
    dataIda: normalizeDateColumn(row.dataIda),
    dataVolta: normalizeDateColumn(row.dataVolta),
    valorTotal: row.valorTotal != null ? parseFloat(row.valorTotal) : 0,
    valorParcela: row.valorParcela != null ? parseFloat(row.valorParcela) : null,
    temJuros: !!row.temJuros,
    ativo: !!row.ativo,
    categorias: row.categorias_raw
      ? row.categorias_raw.split('|').map((s: string) => {
        const [id, ...rest] = s.split(':');
        return { id: parseInt(id), nome: rest.join(':') };
      })
      : [],
    destaques: row.destaques_raw
      ? row.destaques_raw.split('|').map((s: string) => {
        const [id, ...rest] = s.split(':');
        return { id: parseInt(id), nome: rest.join(':') };
      })
      : [],
    categorias_raw: undefined,
    destaques_raw: undefined,
  }));
}

export async function getAllViagens() {
  const rows = await executeQuery<any[]>(`
    SELECT v.*,
      GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.nome) SEPARATOR '|') as categorias_raw,
      GROUP_CONCAT(DISTINCT CONCAT(d.id, ':', d.nome) SEPARATOR '|') as destaques_raw
    FROM viagens v
    LEFT JOIN viagemCategorias vc ON v.id = vc.viagemId
    LEFT JOIN categorias c ON vc.categoriaId = c.id
    LEFT JOIN viagemDestaques vd ON v.id = vd.viagemId
    LEFT JOIN destaques d ON vd.destaqueId = d.id
    WHERE v.ativo = TRUE
      AND v.dataIda IS NOT NULL
      AND DATE(v.dataIda) > CURDATE()
    GROUP BY v.id
    ORDER BY v.criadoEm DESC
  `);
  return parseViagensRows(rows);
}

export async function getAllViagensAdmin() {
  const rows = await executeQuery<any[]>(`
    SELECT v.*,
      GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.nome) SEPARATOR '|') as categorias_raw,
      GROUP_CONCAT(DISTINCT CONCAT(d.id, ':', d.nome) SEPARATOR '|') as destaques_raw
    FROM viagens v
    LEFT JOIN viagemCategorias vc ON v.id = vc.viagemId
    LEFT JOIN categorias c ON vc.categoriaId = c.id
    LEFT JOIN viagemDestaques vd ON v.id = vd.viagemId
    LEFT JOIN destaques d ON vd.destaqueId = d.id
    GROUP BY v.id
    ORDER BY v.criadoEm DESC
  `);
  return parseViagensRows(rows);
}

export async function getViagemById(id: number) {
  const rows = await executeQuery<any[]>(`
    SELECT v.*,
      GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.nome) SEPARATOR '|') as categorias_raw,
      GROUP_CONCAT(DISTINCT CONCAT(d.id, ':', d.nome) SEPARATOR '|') as destaques_raw
    FROM viagens v
    LEFT JOIN viagemCategorias vc ON v.id = vc.viagemId
    LEFT JOIN categorias c ON vc.categoriaId = c.id
    LEFT JOIN viagemDestaques vd ON v.id = vd.viagemId
    LEFT JOIN destaques d ON vd.destaqueId = d.id
    WHERE v.id = ?
    GROUP BY v.id
  `, [id]);
  if (rows.length === 0) return null;
  return parseViagensRows(rows)[0];
}

export async function createViagem(data: any) {
  const result = await executeQuery<any>(`
    INSERT INTO viagens (titulo, slug, descricao, origem, dataIda, dataVolta, quantidadePessoas, valorTotal, quantidadeParcelas, valorParcela, temJuros, xp, hospedagem, imagemUrl, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.titulo,
    data.slug,
    data.descricao,
    data.origem,
    data.dataIda || null,
    data.dataVolta || null,
    data.quantidadePessoas ?? 1,
    data.valorTotal,
    data.quantidadeParcelas || null,
    data.valorParcela || null,
    data.temJuros ? 1 : 0,
    data.xp || 0,
    data.hospedagem || null,
    data.imagemUrl,
    data.ativo !== false ? 1 : 0,
  ]);
  const viagemId = result.insertId;

  if (data.categoriaIds?.length) {
    const placeholders = data.categoriaIds.map(() => '(?, ?)').join(',');
    const values = data.categoriaIds.flatMap((cid: number) => [viagemId, cid]);
    await executeQuery(`INSERT INTO viagemCategorias (viagemId, categoriaId) VALUES ${placeholders}`, values);
  }
  if (data.destaqueIds?.length) {
    const placeholders = data.destaqueIds.map(() => '(?, ?)').join(',');
    const values = data.destaqueIds.flatMap((did: number) => [viagemId, did]);
    await executeQuery(`INSERT INTO viagemDestaques (viagemId, destaqueId) VALUES ${placeholders}`, values);
  }

  return { insertId: viagemId };
}

export async function updateViagem(id: number, data: any) {
  const fields: string[] = [];
  const params: any[] = [];

  const fieldMap: Record<string, any> = {
    titulo: data.titulo,
    slug: data.slug,
    descricao: data.descricao,
    origem: data.origem,
    dataIda: data.dataIda,
    dataVolta: data.dataVolta,
    quantidadePessoas: data.quantidadePessoas,
    valorTotal: data.valorTotal,
    quantidadeParcelas: data.quantidadeParcelas,
    valorParcela: data.valorParcela,
    temJuros: data.temJuros !== undefined ? (data.temJuros ? 1 : 0) : undefined,
    xp: data.xp,
    hospedagem: data.hospedagem,
    imagemUrl: data.imagemUrl,
    ativo: data.ativo !== undefined ? (data.ativo ? 1 : 0) : undefined,
  };

  for (const [key, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length > 0) {
    params.push(id);
    await executeQuery(`UPDATE viagens SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  if (data.categoriaIds !== undefined) {
    await executeQuery(`DELETE FROM viagemCategorias WHERE viagemId = ?`, [id]);
    if (data.categoriaIds.length) {
      const placeholders = data.categoriaIds.map(() => '(?, ?)').join(',');
      const values = data.categoriaIds.flatMap((cid: number) => [id, cid]);
      await executeQuery(`INSERT INTO viagemCategorias (viagemId, categoriaId) VALUES ${placeholders}`, values);
    }
  }

  if (data.destaqueIds !== undefined) {
    await executeQuery(`DELETE FROM viagemDestaques WHERE viagemId = ?`, [id]);
    if (data.destaqueIds.length) {
      const placeholders = data.destaqueIds.map(() => '(?, ?)').join(',');
      const values = data.destaqueIds.flatMap((did: number) => [id, did]);
      await executeQuery(`INSERT INTO viagemDestaques (viagemId, destaqueId) VALUES ${placeholders}`, values);
    }
  }
}

export async function deleteViagem(id: number) {
  await executeQuery(`DELETE FROM viagens WHERE id = ?`, [id]);
}

export async function getAllCategorias() {
  return await executeQuery<any[]>(`SELECT * FROM categorias ORDER BY nome`);
}

export async function createCategoria(nome: string) {
  return await executeQuery<any>(`INSERT INTO categorias (nome) VALUES (?)`, [nome]);
}

export async function deleteCategoria(id: number) {
  await executeQuery(`DELETE FROM categorias WHERE id = ?`, [id]);
}

export async function getAllDestaques() {
  return await executeQuery<any[]>(`SELECT * FROM destaques ORDER BY nome`);
}

export async function createDestaque(nome: string) {
  return await executeQuery<any>(`INSERT INTO destaques (nome) VALUES (?)`, [nome]);
}

export async function deleteDestaque(id: number) {
  await executeQuery(`DELETE FROM destaques WHERE id = ?`, [id]);
}

// Quotations queries
export async function createQuotation(quotation: InsertQuotation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quotations).values(quotation);
  return result;
}

export async function getAllQuotations() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(quotations);
}

export async function updateQuotationStatus(id: number, status: "pending" | "contacted" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quotations).set({ status }).where(eq(quotations.id, id));
}

export async function deleteQuotation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(quotations).where(eq(quotations.id, id));
}

// Company Settings queries
export async function getCompanySettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companySettings).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateCompanySettings(id: number, settings: Partial<InsertCompanySettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companySettings).set(settings).where(eq(companySettings.id, id));
}

export async function createCompanySettings(settings: InsertCompanySettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companySettings).values(settings);
  return result;
}

// Hero Slides queries
export async function getAllHeroSlides() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(heroSlides).orderBy(heroSlides.order);
  return result;
}

export async function getActiveHeroSlides() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(heroSlides).where(eq(heroSlides.isActive, 1)).orderBy(heroSlides.order);
  return result;
}

export async function getHeroSlideById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(heroSlides).where(eq(heroSlides.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createHeroSlide(slide: InsertHeroSlide) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(heroSlides).values(slide);
  return result;
}

export async function updateHeroSlide(id: number, slide: Partial<InsertHeroSlide>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(heroSlides).set(slide).where(eq(heroSlides.id, id));
}

export async function deleteHeroSlide(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(heroSlides).where(eq(heroSlides.id, id));
}

// Ofertas de Voo (Premium)
export async function getActiveOfertasVoo() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(ofertasVoo)
    .where(eq(ofertasVoo.ativo, 1))
    .orderBy(desc(ofertasVoo.id));
}

export async function getOfertasDatasFixasByOfertaIds(ofertaIds: number[]) {
  const db = await getDb();
  if (!db || ofertaIds.length === 0) return [];
  return await db
    .select()
    .from(ofertasDatasFixas)
    .where(inArray(ofertasDatasFixas.ofertaId, ofertaIds));
}

export async function getOfertasDatasFlexiveisByOfertaIds(ofertaIds: number[]) {
  const db = await getDb();
  if (!db || ofertaIds.length === 0) return [];
  return await db
    .select()
    .from(ofertasDatasFlexiveis)
    .where(inArray(ofertasDatasFlexiveis.ofertaId, ofertaIds));
}

// Review Authors queries
export async function upsertReviewAuthor(author: {
  providerId: string;
  loginMethod: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if author exists by providerId
  const existing = await db.select().from(reviewAuthors).where(eq(reviewAuthors.providerId, author.providerId)).limit(1);
  if (existing.length > 0) {
    // Update existing
    await db.update(reviewAuthors)
      .set({ name: author.name, email: author.email, avatarUrl: author.avatarUrl })
      .where(eq(reviewAuthors.providerId, author.providerId));
    return existing[0];
  } else {
    // Insert new
    await db.insert(reviewAuthors).values(author);
    const newAuthor = await db.select().from(reviewAuthors).where(eq(reviewAuthors.providerId, author.providerId)).limit(1);
    return newAuthor[0];
  }
}

export async function getReviewAuthorByProviderId(providerId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reviewAuthors).where(eq(reviewAuthors.providerId, providerId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Reviews queries
export async function createReview(review: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviews).values(review);
  return result;
}

export async function getAllReviews() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      review: reviews,
      author: reviewAuthors,
    })
    .from(reviews)
    .leftJoin(reviewAuthors, eq(reviews.authorId, reviewAuthors.id))
    .orderBy(desc(reviews.createdAt));
  return result.map((row) => ({
    ...row.review,
    author: row.author,
  }));
}

export async function getPendingReviews() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      review: reviews,
      author: reviewAuthors,
    })
    .from(reviews)
    .leftJoin(reviewAuthors, eq(reviews.authorId, reviewAuthors.id))
    .where(eq(reviews.status, "pending"));
  return result.map((row) => ({
    ...row.review,
    author: row.author,
  }));
}

export async function getApprovedReviews() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      review: reviews,
      author: reviewAuthors,
    })
    .from(reviews)
    .leftJoin(reviewAuthors, eq(reviews.authorId, reviewAuthors.id))
    .where(eq(reviews.status, "approved"));
  return result.map((row) => ({
    ...row.review,
    author: row.author,
  }));
}

export async function updateReviewStatus(id: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
}

export async function deleteReview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviews).where(eq(reviews.id, id));
}

// Properties functions
export async function createProperty(data: any) {
  // Geocodificar endereço se tiver os dados necessários e ainda não tiver coordenadas
  let latitude = data.latitude || null;
  let longitude = data.longitude || null;

  // TEMPORARILY DISABLED - geocoding causing server issues
  /*
  if (!latitude || !longitude) {
    if (data.city) {
      try {
        const addressString = buildAddressString({
          address_street: data.address_street,
          address_number: data.address_number,
          neighborhood: data.neighborhood,
          city: data.city,
          state_region: data.state_region,
          country: data.country,
          postal_code: data.postal_code,
        });

        const geocoded = await geocodeAddress(addressString);
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
        console.log(`[createProperty] Geocoded: ${addressString} -> ${latitude}, ${longitude}`);
      } catch (error: any) {
        console.warn(`[createProperty] Geocoding failed: ${error.message}`);
        // Continuar sem coordenadas se falhar
      }
    }
  }
  */

  const result: any = await executeQuery(`
    INSERT INTO properties (
      name, slug, description_short, description_full, property_type_id,
      address_street, address_number, address_complement, neighborhood,
      city, state_region, country, postal_code,
      latitude, longitude, max_guests, bedrooms, beds, bathrooms, area_m2, active, is_featured
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.name,
    data.slug,
    data.description_short || null,
    data.description_full || null,
    data.property_type_id || null,
    data.address_street || null,
    data.address_number || null,
    data.address_complement || null,
    data.neighborhood || null,
    data.city,
    data.state_region || null,
    data.country,
    data.postal_code || null,
    latitude,
    longitude,
    data.max_guests,
    data.bedrooms,
    data.beds,
    data.bathrooms,
    data.area_m2 || null,
    data.active ?? true,
    data.is_featured ?? false
  ]);

  return { id: result.insertId, ...data, latitude, longitude };
}

export async function updateProperty(id: number, data: any) {
  const fields = [];
  const values = [];

  // Verificar se algum campo de endereço foi atualizado
  const addressFields = ['address_street', 'address_number', 'neighborhood', 'city', 'state_region', 'country', 'postal_code'];
  const hasAddressUpdate = addressFields.some(field => data[field] !== undefined);

  // TEMPORARILY DISABLED - geocoding causing server issues
  /*
  // Se o endereço mudou e não tem coordenadas explícitas, geocodificar
  if (hasAddressUpdate && data.latitude === undefined && data.longitude === undefined) {
    try {
      // Buscar dados atuais da propriedade
      const current = await getPropertyById(id);
      if (current) {
        const addressData = {
          address_street: data.address_street ?? current.address_street,
          address_number: data.address_number ?? current.address_number,
          neighborhood: data.neighborhood ?? current.neighborhood,
          city: data.city ?? current.city,
          state_region: data.state_region ?? current.state_region,
          country: data.country ?? current.country,
          postal_code: data.postal_code ?? current.postal_code,
        };

        if (addressData.city) {
          const addressString = buildAddressString(addressData);
          const geocoded = await geocodeAddress(addressString);
          data.latitude = geocoded.latitude;
          data.longitude = geocoded.longitude;
          console.log(`[updateProperty] Geocoded: ${addressString} -> ${data.latitude}, ${data.longitude}`);
        }
      }
    } catch (error: any) {
      console.warn(`[updateProperty] Geocoding failed: ${error.message}`);
      // Continuar sem atualizar coordenadas se falhar
    }
  }
  */

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
  if (data.description_short !== undefined) { fields.push('description_short = ?'); values.push(data.description_short); }
  if (data.description_full !== undefined) { fields.push('description_full = ?'); values.push(data.description_full); }
  if (data.property_type_id !== undefined) { fields.push('property_type_id = ?'); values.push(data.property_type_id); }
  if (data.address_street !== undefined) { fields.push('address_street = ?'); values.push(data.address_street); }
  if (data.address_number !== undefined) { fields.push('address_number = ?'); values.push(data.address_number); }
  if (data.address_complement !== undefined) { fields.push('address_complement = ?'); values.push(data.address_complement); }
  if (data.neighborhood !== undefined) { fields.push('neighborhood = ?'); values.push(data.neighborhood); }
  if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city); }
  if (data.state_region !== undefined) { fields.push('state_region = ?'); values.push(data.state_region); }
  if (data.country !== undefined) { fields.push('country = ?'); values.push(data.country); }
  if (data.postal_code !== undefined) { fields.push('postal_code = ?'); values.push(data.postal_code); }
  if (data.latitude !== undefined) { fields.push('latitude = ?'); values.push(data.latitude); }
  if (data.longitude !== undefined) { fields.push('longitude = ?'); values.push(data.longitude); }
  if (data.max_guests !== undefined) { fields.push('max_guests = ?'); values.push(data.max_guests); }
  if (data.bedrooms !== undefined) { fields.push('bedrooms = ?'); values.push(data.bedrooms); }
  if (data.beds !== undefined) { fields.push('beds = ?'); values.push(data.beds); }
  if (data.bathrooms !== undefined) { fields.push('bathrooms = ?'); values.push(data.bathrooms); }
  if (data.area_m2 !== undefined) { fields.push('area_m2 = ?'); values.push(data.area_m2); }
  if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active); }
  if (data.is_featured !== undefined) { fields.push('is_featured = ?'); values.push(data.is_featured); }

  if (fields.length === 0) return { success: true };

  fields.push('updated_at = NOW()');
  values.push(id);

  await executeQuery(`
    UPDATE properties 
    SET ${fields.join(', ')}
    WHERE id = ?
  `, values);

  return { success: true, latitude: data.latitude, longitude: data.longitude };
}

export async function getPropertyBySlug(slug: string) {
  const result: any[] = await executeQuery(`
    SELECT 
      id, name, slug, description_short, description_full, property_type_id,
      address_street, address_number, address_complement, neighborhood,
      city, state_region, country, postal_code,
      latitude, longitude, max_guests, bedrooms, beds, bathrooms, area_m2,
      active, is_featured, created_at, updated_at
    FROM properties 
    WHERE slug = ? 
    LIMIT 1
  `, [slug]);

  return result[0] || null;
}

export async function getPropertyById(id: number) {
  const result: any[] = await executeQuery(`
    SELECT 
      id, name, slug, description_short, description_full, property_type_id,
      address_street, address_number, address_complement, neighborhood,
      city, state_region, country, postal_code,
      latitude, longitude, max_guests, bedrooms, beds, bathrooms, area_m2,
      active, is_featured, created_at, updated_at
    FROM properties 
    WHERE id = ? 
    LIMIT 1
  `, [id]);

  return result[0] || null;
}

export async function getActiveProperties() {
  const result = await executeQuery<any[]>(`
    SELECT
      p.*,
      COALESCE(
        (SELECT pi.image_url
         FROM property_images pi
         WHERE pi.property_id = p.id
         ORDER BY pi.sort_order ASC
         LIMIT 1),
        NULL
      ) as primary_image
    FROM properties p
    WHERE p.active = true
    ORDER BY p.city, p.name
  `);

  return result;
}

export async function getFeaturedProperties() {
  try {
    // Buscar propriedades em destaque primeiro (se o campo existir)
    const featured = await executeQuery<any[]>(`
      SELECT p.*, pi.image_url as primary_image
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id 
        AND pi.sort_order = (
          SELECT MIN(sort_order) 
          FROM property_images pi2 
          WHERE pi2.property_id = p.id
        )
      WHERE p.active = true AND p.is_featured = true
      ORDER BY RAND()
    `);

    // Se não tiver 6 em destaque, completar com outras aleatórias
    if (featured.length < 6) {
      const remaining = 6 - featured.length;
      const featuredIds = featured.map((p: any) => p.id).filter((id: any) => id != null);

      let additional: any[];
      if (featuredIds.length > 0) {
        const placeholders = featuredIds.map(() => '?').join(',');
        const notInClause = featuredIds.length > 0 ? `AND p.id NOT IN (${placeholders})` : '';
        const query = `
          SELECT p.*, pi.image_url as primary_image
          FROM properties p
          LEFT JOIN property_images pi ON p.id = pi.property_id 
            AND pi.sort_order = (
              SELECT MIN(sort_order) 
              FROM property_images pi2 
              WHERE pi2.property_id = p.id
            )
          WHERE p.active = true
          ${notInClause}
          ORDER BY RAND()
          LIMIT ?
        `;
        const params = [...featuredIds, remaining];
        // Debug logs
        const numPlaceholders = (query.match(/\?/g) || []).length;
        console.log('[getFeaturedProperties] SQL:', query);
        console.log('[getFeaturedProperties] Params:', params);
        console.log('[getFeaturedProperties] Number of placeholders:', numPlaceholders, 'Params length:', params.length);
        additional = await executeQuery<any[]>(query, params);
      } else {
        const query = `
          SELECT p.*, pi.image_url as primary_image
          FROM properties p
          LEFT JOIN property_images pi ON p.id = pi.property_id 
            AND pi.sort_order = (
              SELECT MIN(sort_order) 
              FROM property_images pi2 
              WHERE pi2.property_id = p.id
            )
          WHERE p.active = true
          ORDER BY RAND()
          LIMIT ?
        `;
        const params = [remaining];
        const numPlaceholders = (query.match(/\?/g) || []).length;
        console.log('[getFeaturedProperties] SQL:', query);
        console.log('[getFeaturedProperties] Params:', params);
        console.log('[getFeaturedProperties] Number of placeholders:', numPlaceholders, 'Params length:', params.length);
        additional = await executeQuery<any[]>(query, params);
      }

      return [...featured, ...additional];
    }

    return featured;
  } catch (error) {
    // Fallback para propriedades aleatórias se o campo is_featured não existir
    console.log('[getFeaturedProperties] Fallback to random properties:', (error as Error).message);
    return await executeQuery<any[]>(
      `
        SELECT p.*, pi.image_url as primary_image
        FROM properties p
        LEFT JOIN property_images pi ON p.id = pi.property_id
          AND pi.sort_order = (
            SELECT MIN(sort_order)
            FROM property_images pi2
            WHERE pi2.property_id = p.id
          )
        WHERE p.active = true
        ORDER BY RAND()
        LIMIT 6
      `);
    const randomProperties = await executeQuery<any[]>(`
      SELECT p.*, pi.image_url as primary_image
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id 
        AND pi.sort_order = (
          SELECT MIN(sort_order) 
          FROM property_images pi2 
          WHERE pi2.property_id = p.id
        )
      WHERE p.active = true
      ORDER BY RAND()
      LIMIT 6
    `, []);

    return randomProperties;
  }
}

export async function getAllPropertiesAdmin() {
  try {
    const result = await executeQuery(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description_short,
        p.description_full,
        p.property_type_id,
        p.address_street,
        p.address_number,
        p.address_complement,
        p.neighborhood,
        p.city,
        p.state_region,
        p.country,
        p.postal_code,
        p.latitude,
        p.longitude,
        p.max_guests,
        p.bedrooms,
        p.beds,
        p.bathrooms,
        p.area_m2,
        p.active,
        p.is_featured,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT pr.id) AS rooms_count
      FROM properties p
      LEFT JOIN property_rooms pr ON pr.property_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    return result;
  } catch (error) {
    console.error('[getAllPropertiesAdmin] Database error:', error);
    throw error;
  }
}

export async function getPropertyImages(propertyId: number) {
  const result = await executeQuery(`
    SELECT * FROM property_images 
    WHERE property_id = ?
    ORDER BY sort_order ASC
  `, [propertyId]);

  return result;
}

export async function getPropertyAmenities(propertyId: number) {
  const result = await executeQuery(`
    SELECT pa.* FROM property_amenities pa
    JOIN property_amenities_rel par ON pa.id = par.amenity_id
    WHERE par.property_id = ?
    ORDER BY pa.name
  `, [propertyId]);

  return result;
}

export async function savePropertyImages(propertyId: number, images: any[]) {
  // Remove imagens existentes
  await executeQuery(`DELETE FROM property_images WHERE property_id = ?`, [propertyId]);

  // Adiciona novas imagens
  for (const image of images) {
    await executeQuery(`
      INSERT INTO property_images (property_id, image_url, is_primary, sort_order)
      VALUES (?, ?, ?, ?)
    `, [propertyId, image.image_url, image.is_primary, image.sort_order]);
  }

  return { success: true };
}

export async function updatePropertyImages(propertyId: number, updates: {
  toDelete?: number[]; // IDs das imagens a deletar
  toAdd?: any[]; // Novas imagens a adicionar
  toUpdate?: { id: number; is_primary?: boolean; sort_order?: number }[]; // Imagens existentes a atualizar
}) {
  const { toDelete = [], toAdd = [], toUpdate = [] } = updates;

  // Deletar imagens removidas
  if (toDelete.length > 0) {
    const placeholders = toDelete.map(() => '?').join(',');
    await executeQuery(`DELETE FROM property_images WHERE id IN (${placeholders})`, toDelete);
  }

  // Atualizar imagens existentes
  for (const update of toUpdate) {
    const fields = [];
    const values = [];

    if (update.is_primary !== undefined) {
      fields.push('is_primary = ?');
      values.push(update.is_primary);
    }

    if (update.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(update.sort_order);
    }

    if (fields.length > 0) {
      values.push(update.id);
      await executeQuery(`UPDATE property_images SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  }

  // Adicionar novas imagens
  for (const image of toAdd) {
    await executeQuery(`
      INSERT INTO property_images (property_id, image_url, is_primary, sort_order)
      VALUES (?, ?, ?, ?)
    `, [propertyId, image.image_url, image.is_primary, image.sort_order]);
  }

  return { success: true };
}

export async function getAllAmenities() {
  const result = await executeQuery(`
    SELECT * FROM property_amenities ORDER BY name
  `);

  return result;
}

export async function createAmenity(data: any) {
  const result: any = await executeQuery(`
    INSERT INTO property_amenities (name, icon)
    VALUES (?, ?)
  `, [data.name, data.icon || null]);

  return { id: result.insertId, ...data };
}

// Property Types functions
export async function getAllPropertyTypes() {
  const result = await executeQuery(`
    SELECT id, name, slug FROM property_types 
    ORDER BY name ASC
  `);

  return result;
}

export async function associatePropertyAmenities(propertyId: number, amenityIds: number[]) {
  // Remove associações existentes
  await executeQuery(`DELETE FROM property_amenities_rel WHERE property_id = ?`, [propertyId]);

  // Adiciona novas associações
  for (const amenityId of amenityIds) {
    await executeQuery(`
      INSERT INTO property_amenities_rel (property_id, amenity_id)
      VALUES (?, ?)
    `, [propertyId, amenityId]);
  }

  return { success: true };
}

export async function deleteProperty(id: number) {
  // Remove images first (cascade)
  await executeQuery(`DELETE FROM property_images WHERE property_id = ?`, [id]);

  // Remove amenity associations
  await executeQuery(`DELETE FROM property_amenities_rel WHERE property_id = ?`, [id]);

  // Remove property
  await executeQuery(`DELETE FROM properties WHERE id = ?`, [id]);

  return { success: true };
}

// ============================================
// ROOM TYPES FUNCTIONS
// ============================================

export async function getAllRoomTypes() {
  const result = await executeQuery(`
    SELECT id, name
    FROM room_types 
    ORDER BY name ASC
  `);
  return result;
}

export async function createRoomType(data: { name: string }) {
  const result = await executeQuery(
    `INSERT INTO room_types (name) VALUES (?)`,
    [data.name]
  );
  return result;
}

export async function updateRoomType(id: number, data: { name?: string }) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  if (updates.length === 0) return;

  values.push(id);
  const result = await executeQuery(
    `UPDATE room_types SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return result;
}

export async function deleteRoomType(id: number) {
  const result = await executeQuery(`DELETE FROM room_types WHERE id = ?`, [id]);
  return result;
}

// ============================================
// BED TYPES FUNCTIONS
// ============================================

export async function getAllBedTypes() {
  const result = await executeQuery(`
    SELECT id, name, sleeps as sleepsCount
    FROM bed_types 
    ORDER BY name ASC
  `);
  return result;
}

export async function createBedType(data: { name: string; sleepsCount: number }) {
  const result = await executeQuery(
    `INSERT INTO bed_types (name, sleeps) VALUES (?, ?)`,
    [data.name, data.sleepsCount]
  );
  return result;
}

export async function updateBedType(id: number, data: { name?: string; sleepsCount?: number }) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.sleepsCount !== undefined) {
    updates.push('sleeps = ?');
    values.push(data.sleepsCount);
  }

  if (updates.length === 0) return;

  values.push(id);
  const result = await executeQuery(
    `UPDATE bed_types SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return result;
}

export async function deleteBedType(id: number) {
  const result = await executeQuery(`DELETE FROM bed_types WHERE id = ?`, [id]);
  return result;
}

// ============================================
// PROPERTY ROOMS FUNCTIONS
// ============================================

export async function getPropertyRooms(propertyId: number) {
  const result = await executeQuery(`
    SELECT 
      pr.id,
      pr.property_id as propertyId,
      pr.room_type_id as roomTypeId,
      pr.name,
      pr.display_order as displayOrder,
      pr.sleeping_photo as sleepingPhoto,
      rt.name as roomTypeName
    FROM property_rooms pr
    JOIN room_types rt ON pr.room_type_id = rt.id
    WHERE pr.property_id = ?
    ORDER BY pr.display_order ASC, pr.id ASC
  `, [propertyId]);
  return result;
}

export async function getPropertyRoomsWithBeds(propertyId: number) {
  // Get rooms
  const rooms = await executeQuery(`
    SELECT 
      pr.id,
      pr.property_id as propertyId,
      pr.room_type_id as roomTypeId,
      pr.name,
      pr.display_order as displayOrder,
      pr.sleeping_photo as sleepingPhoto,
      rt.name as roomTypeName
    FROM property_rooms pr
    JOIN room_types rt ON pr.room_type_id = rt.id
    WHERE pr.property_id = ?
    ORDER BY pr.display_order ASC, pr.id ASC
  `, [propertyId]);

  // Get beds for each room
  const roomsWithBeds = await Promise.all(
    rooms.map(async (room: any) => {
      const beds = await executeQuery(`
        SELECT 
          rb.id,
          rb.room_id as roomId,
          rb.bed_type_id as bedTypeId,
          rb.quantity,
          bt.name as bedTypeName,
          bt.sleeps as sleepsCount
        FROM room_beds rb
        JOIN bed_types bt ON rb.bed_type_id = bt.id
        WHERE rb.room_id = ?
        ORDER BY rb.id ASC
      `, [room.id]);

      return {
        ...room,
        beds,
      };
    })
  );

  // Filter only rooms that have beds
  return roomsWithBeds.filter((room: any) => room.beds.length > 0);
}

export async function createPropertyRoom(data: {
  propertyId: number;
  roomTypeId: number;
  name?: string;
  displayOrder?: number;
}) {
  const displayOrder = data.displayOrder ?? 0;
  const result: any = await executeQuery(`
    INSERT INTO property_rooms (property_id, room_type_id, name, display_order)
    VALUES (?, ?, ?, ?)
  `, [data.propertyId, data.roomTypeId, data.name || null, displayOrder]);

  return { id: result.insertId, ...data };
}

export async function updatePropertyRoom(id: number, data: {
  roomTypeId?: number;
  name?: string;
  displayOrder?: number;
  sleepingPhoto?: string | null;
}) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.roomTypeId !== undefined) {
    fields.push('room_type_id = ?');
    values.push(data.roomTypeId);
  }

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name || null);
  }

  if (data.displayOrder !== undefined) {
    fields.push('display_order = ?');
    values.push(data.displayOrder);
  }

  if (data.sleepingPhoto !== undefined) {
    fields.push('sleeping_photo = ?');
    values.push(data.sleepingPhoto || null);
  }

  if (fields.length === 0) return { success: true };

  values.push(id);

  await executeQuery(`
    UPDATE property_rooms 
    SET ${fields.join(', ')}
    WHERE id = ?
  `, values);

  return { success: true };
}

export async function deletePropertyRoom(id: number) {
  // Beds will be deleted automatically due to CASCADE
  await executeQuery(`DELETE FROM property_rooms WHERE id = ?`, [id]);
  return { success: true };
}

export async function reorderPropertyRooms(propertyId: number, roomIds: number[]) {
  // Update display_order for each room
  await Promise.all(
    roomIds.map((roomId, index) =>
      executeQuery(`
        UPDATE property_rooms 
        SET display_order = ?
        WHERE id = ? AND property_id = ?
      `, [index, roomId, propertyId])
    )
  );

  return { success: true };
}

// ============================================
// ROOM BEDS FUNCTIONS
// ============================================

export async function getRoomBeds(roomId: number) {
  const result = await executeQuery(`
    SELECT 
      rb.id,
      rb.room_id as roomId,
      rb.bed_type_id as bedTypeId,
      rb.quantity,
      bt.name as bedTypeName,
      bt.sleeps as sleepsCount
    FROM room_beds rb
    JOIN bed_types bt ON rb.bed_type_id = bt.id
    WHERE rb.room_id = ?
    ORDER BY rb.id ASC
  `, [roomId]);
  return result;
}

export async function createRoomBed(data: { roomId: number; bedTypeId: number; quantity: number }) {
  const result: any = await executeQuery(`
    INSERT INTO room_beds (room_id, bed_type_id, quantity)
    VALUES (?, ?, ?)
  `, [data.roomId, data.bedTypeId, data.quantity]);

  return { id: result.insertId, ...data };
}

export async function updateRoomBed(id: number, data: { bedTypeId?: number; quantity?: number }) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.bedTypeId !== undefined) {
    fields.push('bed_type_id = ?');
    values.push(data.bedTypeId);
  }
  if (data.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(data.quantity);
  }

  if (fields.length === 0) return { success: true };

  values.push(id);

  await executeQuery(`
    UPDATE room_beds 
    SET ${fields.join(', ')}
    WHERE id = ?
  `, values);

  return { success: true };
}

export async function deleteRoomBed(id: number) {
  await executeQuery(`DELETE FROM room_beds WHERE id = ?`, [id]);
  return { success: true };
}

