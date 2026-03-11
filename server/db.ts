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
import { InsertUser, users, travels, InsertTravel, categories, InsertCategory, travelCategories, quotations, InsertQuotation, companySettings, InsertCompanySettings, heroSlides, InsertHeroSlide, reviewAuthors, reviews, InsertReviewAuthor, InsertReview, ofertasVoo, ofertasDatasFixas, ofertasDatasFlexiveis, clientes, InsertCliente, xpContas, xpMovimentacoes, xpTiposMovimentacao, xpCodigos, xpCodigosUsados, xpConfiguracoes } from "../drizzle/schema";
import { ENV } from './_core/env';
// import { geocodeAddress, buildAddressString } from './_core/map';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || 10000);
const DB_RETRY_COUNT = Number(process.env.DB_RETRY_COUNT || 1);

function isTransientDbError(error: any): boolean {
  const code = String(error?.code || "");
  const message = String(error?.message || "");

  if (["ETIMEDOUT", "ECONNRESET", "PROTOCOL_CONNECTION_LOST", "EPIPE", "ECONNREFUSED"].includes(code)) {
    return true;
  }

  return /ETIMEDOUT|timeout|connection\s+lost|read\s+econreset/i.test(message);
}

async function recreatePool() {
  try {
    if (_pool) {
      await new Promise<void>((resolve) => _pool!.end(() => resolve()));
    }
  } catch {
    // ignore errors while tearing down pool
  }

  _pool = null;
  _db = null;
  await getDb();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
        queueLimit: Number(process.env.DB_QUEUE_LIMIT || 50),
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

async function executeQuery<T = any>(query: string, params: any[] = [], timeout: number = DB_QUERY_TIMEOUT_MS): Promise<T> {
  if (!_pool) {
    await getDb();
    if (!_pool) throw new Error("Database not available");
  }

  const executeOnce = () =>
    new Promise<T>((resolve, reject) => {
      _pool!.getConnection((connErr, connection) => {
        if (connErr || !connection) {
          reject(connErr || new Error("Failed to get DB connection"));
          return;
        }

        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          connection.destroy();
          reject(new Error(`Query timeout after ${timeout}ms: ${query.slice(0, 120)}...`));
        }, timeout);

        connection.execute(query, params, (err, results) => {
          clearTimeout(timer);
          if (!timedOut) {
            connection.release();
          }

          if (timedOut) {
            return;
          }

          if (err) {
            console.error(`[Database Error] ${err.message}`, { query: query.slice(0, 100), params });
            reject(err);
            return;
          }

          resolve(results as T);
        });
      });
    });

  const maxAttempts = Math.max(1, DB_RETRY_COUNT + 1);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await executeOnce();
    } catch (error) {
      lastError = error;
      const canRetry = attempt < maxAttempts && isTransientDbError(error);
      if (!canRetry) {
        throw error;
      }

      console.warn(`[Database] transient error, retrying (${attempt}/${maxAttempts - 1})`, {
        message: (error as Error)?.message,
      });
      await recreatePool();
      await delay(150 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Database query failed");
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

function normalizeOptionalDateColumn(d: any): string | null | undefined {
  if (d === undefined) return undefined;
  return normalizeDateColumn(d);
}

function normalizeTipoSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function parseViagensRows(rows: any[]) {
  return rows.map((row: any) => ({
    ...row,
    tipoViagem: row.tipoViagem ?? row.tipo_viagem ?? 'pacote',
    tipoQuarto: row.tipoQuarto ?? row.tipo_quarto ?? null,
    dataIda: normalizeDateColumn(row.dataIda),
    dataVolta: normalizeDateColumn(row.dataVolta),
    dataExpiracao: normalizeDateColumn(row.data_expiracao ?? row.dataExpiracao),
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
  try {
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
  } catch (error) {
    console.error('[getAllViagens] returning empty list due to DB error:', (error as Error).message);
    return [];
  }
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
    INSERT INTO viagens (titulo, slug, descricao, tipo_viagem, origem, dataIda, dataVolta, quantidadePessoas, valorTotal, quantidadeParcelas, valorParcela, temJuros, xp, hospedagem, tipo_quarto, imagemUrl, data_expiracao, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.titulo,
    data.slug,
    data.descricao,
    data.tipoViagem || 'pacote',
    data.origem,
    normalizeDateColumn(data.dataIda),
    normalizeDateColumn(data.dataVolta),
    data.quantidadePessoas ?? 1,
    data.valorTotal,
    data.quantidadeParcelas || null,
    data.valorParcela || null,
    data.temJuros ? 1 : 0,
    data.xp || 0,
    data.hospedagem || null,
    data.tipoQuarto || null,
    data.imagemUrl,
    normalizeDateColumn(data.dataExpiracao || data.data_expiracao || null),
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
    tipo_viagem: data.tipoViagem,
    origem: data.origem,
    dataIda: normalizeOptionalDateColumn(data.dataIda),
    dataVolta: normalizeOptionalDateColumn(data.dataVolta),
    data_expiracao: normalizeOptionalDateColumn(data.dataExpiracao),
    quantidadePessoas: data.quantidadePessoas,
    valorTotal: data.valorTotal,
    quantidadeParcelas: data.quantidadeParcelas,
    valorParcela: data.valorParcela,
    temJuros: data.temJuros !== undefined ? (data.temJuros ? 1 : 0) : undefined,
    xp: data.xp,
    hospedagem: data.hospedagem,
    tipo_quarto: data.tipoQuarto,
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
    const sql = `UPDATE viagens SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, params);
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
  try {
    return await executeQuery<any[]>(`SELECT * FROM categorias ORDER BY nome`);
  } catch (error) {
    console.error('[getAllCategorias] returning empty list due to DB error:', (error as Error).message);
    return [];
  }
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
      latitude, longitude, max_guests, bedrooms, beds, bathrooms, xp, area_m2, active, is_featured
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.xp ?? 0,
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
  if (data.xp !== undefined) { fields.push('xp = ?'); values.push(data.xp); }
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
      latitude, longitude, max_guests, bedrooms, beds, bathrooms, xp, area_m2,
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
      latitude, longitude, max_guests, bedrooms, beds, bathrooms, xp, area_m2,
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
      LIMIT 6
    `);

    // Se não tiver 6 em destaque, completar com outras aleatórias
    if (featured.length < 6) {
      const remaining = Math.max(0, 6 - featured.length);
      const featuredIds = featured
        .map((p: any) => Number(p.id))
        .filter((id: number) => Number.isInteger(id) && id > 0);

      let additional: any[];
      if (featuredIds.length > 0) {
        const notInClause = `AND p.id NOT IN (${featuredIds.join(',')})`;
        const safeLimit = Math.max(0, Math.floor(remaining));
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
          LIMIT ${safeLimit}
        `;
        additional = await executeQuery<any[]>(query);
      } else {
        const safeLimit = Math.max(0, Math.floor(remaining));
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
          LIMIT ${safeLimit}
        `;
        additional = await executeQuery<any[]>(query);
      }

      return [...featured, ...additional];
    }

    return featured;
  } catch (error) {
    // Fallback para propriedades ativas se o campo is_featured não existir
    console.log('[getFeaturedProperties] Fallback to random properties:', (error as Error).message);
    try {
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
          ORDER BY p.updated_at DESC, p.created_at DESC
          LIMIT 6
        `
      );
    } catch (fallbackError) {
      console.error('[getFeaturedProperties] returning empty list due to fallback DB error:', (fallbackError as Error).message);
      return [];
    }
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
        p.xp,
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

// ═══════════════════════════════════════════════════════════════════
// ÁREA DO CLIENTE / FIDELIDADE XP
// ═══════════════════════════════════════════════════════════════════

// ── Clientes ──────────────────────────────────────────────────────

export async function getClienteById(id: number) {
  const rows: any[] = await executeQuery(`SELECT * FROM clientes WHERE id = ? LIMIT 1`, [id]);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function getClienteByEmail(email: string) {
  const rows: any[] = await executeQuery(`SELECT * FROM clientes WHERE email = ? LIMIT 1`, [email]);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function createCliente(data: {
  nome?: string | null;
  email: string;
  passwordHash?: string | null;
  origemCadastro?: string;
  avatarUrl?: string | null;
}): Promise<{ id: number }> {
  const result: any = await executeQuery(
    `INSERT INTO clientes (nome, email, avatar_url, password_hash, origem_cadastro, cadastro_completo)
     VALUES (?, ?, ?, ?, ?, FALSE)`,
    [data.nome || null, data.email, data.avatarUrl || null, data.passwordHash || null, data.origemCadastro || null]
  );
  return { id: result.insertId };
}

export async function updateClienteAvatar(id: number, avatarUrl: string | null) {
  await executeQuery(`UPDATE clientes SET avatar_url = ? WHERE id = ?`, [avatarUrl, id]);
  return { success: true };
}

export async function updateClienteCadastro(
  id: number,
  data: {
    cpf: string;
    telefone: string;
    cep: string;
    endereco: string;
    numero: string;
    complemento?: string | null;
    cidade: string;
    estado: string;
  }
) {
  await executeQuery(
    `UPDATE clientes SET
       cpf = ?, telefone = ?, cep = ?, endereco = ?, numero = ?,
       complemento = ?, cidade = ?, estado = ?, cadastro_completo = TRUE
     WHERE id = ?`,
    [data.cpf, data.telefone, data.cep, data.endereco, data.numero,
    data.complemento || null, data.cidade, data.estado, id]
  );
  return { success: true };
}

export async function updateClientePasswordHash(id: number, passwordHash: string) {
  await executeQuery(`UPDATE clientes SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
}

// ── XP Contas ─────────────────────────────────────────────────────

export async function getOrCreateXpConta(clienteId: number) {
  const rows: any[] = await executeQuery(
    `SELECT * FROM xp_contas WHERE id_cliente = ? LIMIT 1`, [clienteId]
  );
  if (rows.length > 0) return rows[0];
  const result: any = await executeQuery(
    `INSERT INTO xp_contas (id_cliente, saldo_xp) VALUES (?, 0)`, [clienteId]
  );
  return { id: result.insertId, id_cliente: clienteId, saldo_xp: 0 };
}

// ── XP Configurações ──────────────────────────────────────────────

export async function getXpConfig(chave: string): Promise<string | null> {
  const rows: any[] = await executeQuery(
    `SELECT valor FROM xp_configuracoes WHERE chave = ? LIMIT 1`, [chave]
  );
  return rows.length > 0 ? rows[0].valor : null;
}

export async function getXpConfigNum(chave: string, fallback: number): Promise<number> {
  const v = await getXpConfig(chave);
  if (v === null) return fallback;
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

// ── XP Dashboard ──────────────────────────────────────────────────

export async function getXpDashboard(clienteId: number) {
  const hoje = new Date().toISOString().slice(0, 10);

  // Saldo total: soma de TODAS movimentações
  const [totalRow]: any[] = await executeQuery(
    `SELECT COALESCE(SUM(xp), 0) AS total FROM xp_movimentacoes WHERE id_cliente = ?`,
    [clienteId]
  );
  const saldoTotal = Number(totalRow.total);

  // Saldo disponível: créditos não vencidos + todos os débitos
  const [dispRow]: any[] = await executeQuery(
    `SELECT COALESCE(SUM(m.xp), 0) AS total
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     WHERE m.id_cliente = ?
       AND (
         t.tipo_operacao = 'debito'
         OR (t.tipo_operacao = 'credito' AND (
           t.dias_expiracao IS NULL
           OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?
         ))
       )`,
    [clienteId, hoje]
  );
  const saldoDisponivel = Number(dispRow.total);

  // Saldo resgatável via regra de negócio
  const resgate = await calcSaldoResgate(clienteId);

  // Configs
  const xpValorReais = await getXpConfigNum('xp_valor_reais', 0.10);
  const xpAlertaDias = await getXpConfigNum('xp_alerta_vencimento_dias', 30);

  const valorEmReais = saldoDisponivel * xpValorReais;
  const podeResgatar = resgate.saldoResgatavel > 0;

  // Pontos próximos a vencer
  const limiteExpiracao = new Date();
  limiteExpiracao.setDate(limiteExpiracao.getDate() + xpAlertaDias);
  const limiteStr = limiteExpiracao.toISOString().slice(0, 10);

  const pontosExpirar: any[] = await executeQuery(
    `SELECT m.id, m.xp, DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) AS data_expiracao,
            m.descricao, t.nome AS tipo_nome
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     WHERE m.id_cliente = ?
       AND t.tipo_operacao = 'credito'
       AND t.dias_expiracao IS NOT NULL
       AND DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?
       AND DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) <= ?
     ORDER BY data_expiracao ASC
     LIMIT 10`,
    [clienteId, hoje, limiteStr]
  );

  // Últimas 5 movimentações
  const ultimas: any[] = await executeQuery(
    `SELECT m.id, m.xp, m.saldo_apos, m.descricao, m.codigo_ref, m.valor_referencia, m.data_compra, m.data_movimentacao,
            DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) AS data_expiracao,
            t.nome AS tipo_nome, t.slug AS tipo_slug, t.descricao AS tipo_descricao, t.tipo_operacao, t.qualificavel
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     WHERE m.id_cliente = ?
     ORDER BY m.data_movimentacao DESC
     LIMIT 5`,
    [clienteId]
  );

  return {
    saldoTotal,
    saldoDisponivel,
    saldoQualificavel: resgate.saldoQualificavel,
    saldoNaoQualificavel: resgate.saldoNaoQualificavel,
    saldoResgatavel: resgate.saldoResgatavel,
    bonusDesbloqueado: resgate.bonusDesbloqueado,
    valorEmReais,
    podeResgatar,
    xpMinimoResgate: resgate.xpMinimoResgate,
    xpValorReais,
    pontosExpirar,
    ultimasMovimentacoes: ultimas,
  };
}

// ── XP Extrato ────────────────────────────────────────────────────

export async function getXpExtrato(
  clienteId: number,
  filtros: {
    dataInicio?: string;
    dataFim?: string;
    tipoMovimentacaoId?: number;
    somenteQualificaveis?: boolean;
    page?: number;
    pageSize?: number;
  }
) {
  const page = filtros.page || 1;
  const pageSize = filtros.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let where = `WHERE m.id_cliente = ?`;
  const params: any[] = [clienteId];

  if (filtros.dataInicio) {
    where += ` AND m.data_movimentacao >= ?`;
    params.push(filtros.dataInicio);
  }
  if (filtros.dataFim) {
    where += ` AND m.data_movimentacao <= ?`;
    params.push(filtros.dataFim + ' 23:59:59');
  }
  if (filtros.tipoMovimentacaoId) {
    where += ` AND m.id_tipo_movimentacao = ?`;
    params.push(filtros.tipoMovimentacaoId);
  }
  if (filtros.somenteQualificaveis) {
    where += ` AND t.qualificavel = 1`;
  }

  const countParams = [...params];
  const [countRow]: any[] = await executeQuery(
    `SELECT COUNT(*) as total
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     ${where}`,
    countParams
  );

  params.push(String(pageSize), String(offset));
  const rows: any[] = await executeQuery(
    `SELECT m.id, m.xp, m.saldo_apos, m.descricao, m.codigo_ref, m.valor_referencia, m.data_compra, m.data_movimentacao,
            DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) AS data_expiracao,
            t.nome AS tipo_nome, t.slug AS tipo_slug, t.descricao AS tipo_descricao, t.tipo_operacao, t.qualificavel
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     ${where}
     ORDER BY m.data_movimentacao DESC
     LIMIT ? OFFSET ?`,
    params
  );

  return {
    items: rows,
    total: Number(countRow.total),
    page,
    pageSize,
    totalPages: Math.ceil(Number(countRow.total) / pageSize),
  };
}

// ── Tipos de movimentação (para filtro do extrato) ────────────────

export async function listTiposMovimentacao() {
  return await executeQuery(
    `SELECT id, nome, slug, tipo_operacao, qualificavel, exibir_no_lancamento_manual, ativo, descricao, dias_expiracao, created_at
     FROM xp_tipos_movimentacao
     ORDER BY ativo DESC, nome`
  );
}

export async function updateTipoMovimentacaoExibicao(input: { id: number; exibirNoLancamentoManual: boolean }) {
  await executeQuery(
    `UPDATE xp_tipos_movimentacao SET exibir_no_lancamento_manual = ? WHERE id = ?`,
    [input.exibirNoLancamentoManual ? 1 : 0, input.id]
  );
  return { ok: true };
}

export async function createTipoMovimentacao(input: {
  nome: string;
  slug?: string;
  tipoOperacao: string;
  qualificavel: boolean;
  exibirNoLancamentoManual: boolean;
  descricao?: string | null;
  diasExpiracao?: number | null;
}) {
  const slug = normalizeTipoSlug(input.slug || input.nome);
  if (!slug) throw new Error('Slug do tipo de movimentacao invalido.');

  const result: any = await executeQuery(
    `INSERT INTO xp_tipos_movimentacao (nome, slug, tipo_operacao, qualificavel, exibir_no_lancamento_manual, descricao, dias_expiracao)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.nome,
      slug,
      input.tipoOperacao,
      input.qualificavel ? 1 : 0,
      input.exibirNoLancamentoManual ? 1 : 0,
      input.descricao || null,
      input.diasExpiracao || null,
    ]
  );
  return { id: result.insertId };
}

export async function updateTipoMovimentacao(input: {
  id: number;
  nome: string;
  slug?: string;
  tipoOperacao: string;
  qualificavel: boolean;
  exibirNoLancamentoManual: boolean;
  descricao?: string | null;
  diasExpiracao?: number | null;
}) {
  const slug = normalizeTipoSlug(input.slug || input.nome);
  if (!slug) throw new Error('Slug do tipo de movimentacao invalido.');

  await executeQuery(
    `UPDATE xp_tipos_movimentacao
     SET nome = ?, slug = ?, tipo_operacao = ?, qualificavel = ?, exibir_no_lancamento_manual = ?, descricao = ?, dias_expiracao = ?
     WHERE id = ?`,
    [
      input.nome,
      slug,
      input.tipoOperacao,
      input.qualificavel ? 1 : 0,
      input.exibirNoLancamentoManual ? 1 : 0,
      input.descricao || null,
      input.diasExpiracao || null,
      input.id,
    ]
  );
  return { ok: true };
}

export async function deleteTipoMovimentacao(id: number) {
  // Check if type is referenced in movimentacoes
  const refs: any[] = await executeQuery(
    `SELECT COUNT(*) as total FROM xp_movimentacoes WHERE id_tipo_movimentacao = ?`,
    [id]
  );
  if (refs[0]?.total > 0) {
    // Has related records: inactivate instead of deleting
    await executeQuery(
      `UPDATE xp_tipos_movimentacao SET ativo = 0, exibir_no_lancamento_manual = 0 WHERE id = ?`,
      [id]
    );
    return { ok: true, inativado: true, registros: Number(refs[0].total) };
  }
  await executeQuery(`DELETE FROM xp_tipos_movimentacao WHERE id = ?`, [id]);
  return { ok: true, inativado: false };
}

export async function reativarTipoMovimentacao(id: number) {
  await executeQuery(
    `UPDATE xp_tipos_movimentacao SET ativo = 1 WHERE id = ?`,
    [id]
  );
  return { ok: true };
}

export async function getTipoMovimentacaoPorNome(nome: string) {
  const rows: any[] = await executeQuery(
    `SELECT * FROM xp_tipos_movimentacao WHERE nome = ? LIMIT 1`, [nome]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function getTipoMovimentacaoPorSlug(slug: string) {
  const rows: any[] = await executeQuery(
    `SELECT * FROM xp_tipos_movimentacao WHERE slug = ? LIMIT 1`, [slug]
  );
  return rows.length > 0 ? rows[0] : null;
}

// ── Aplicar código promocional (transacional) ─────────────────────

export async function aplicarCodigoPromocional(clienteId: number, codigoStr: string) {
  // Get raw connection for transaction
  if (!_pool) {
    await getDb();
    if (!_pool) throw new Error("Database not available");
  }

  return new Promise<{ xp: number; descricao: string; saldoApos: number }>((resolve, reject) => {
    _pool!.getConnection((connErr, connection) => {
      if (connErr || !connection) {
        reject(connErr || new Error("Failed to get DB connection"));
        return;
      }

      connection.beginTransaction((txErr) => {
        if (txErr) { connection.release(); reject(txErr); return; }

        const query = (sql: string, params: any[] = []): Promise<any> =>
          new Promise((res, rej) => {
            connection.execute(sql, params, (err, results) => {
              if (err) rej(err); else res(results);
            });
          });

        (async () => {
          // 1. Buscar código
          const codigos: any[] = await query(
            `SELECT * FROM xp_codigos WHERE codigo = ? LIMIT 1`, [codigoStr.trim().toUpperCase()]
          );
          if (codigos.length === 0) throw new Error("Código não encontrado.");
          const codigo = codigos[0];

          // 2. Validade
          if (codigo.data_expiracao) {
            const hoje = new Date().toISOString().slice(0, 10);
            if (codigo.data_expiracao < hoje) throw new Error("Este código já expirou.");
          }

          // 3. Ativo?
          if (codigo.ativo === 0 || codigo.ativo === false) {
            throw new Error("Este código não está ativo.");
          }

          // 4. Limite de uso
          if (codigo.quantidade_max_uso !== null && (codigo.quantidade_usada || 0) >= codigo.quantidade_max_uso) {
            throw new Error("Este código atingiu o limite de uso.");
          }

          // 5. Já utilizado pelo cliente?
          const usados: any[] = await query(
            `SELECT id FROM xp_codigos_usados WHERE id_codigo = ? AND id_cliente = ? LIMIT 1`,
            [codigo.id, clienteId]
          );
          if (usados.length > 0) throw new Error("Você já utilizou este código.");

          // 6. Buscar tipo tecnico 'codigo_promocional' (com fallback por nome para compatibilidade)
          const tipos: any[] = await query(
            `SELECT *
             FROM xp_tipos_movimentacao
             WHERE slug = 'codigo_promocional'
                OR nome IN ('codigo_promocional', 'Codigo Promocional', 'Código Promocional')
             ORDER BY CASE WHEN slug = 'codigo_promocional' THEN 0 ELSE 1 END
             LIMIT 1`
          );
          if (tipos.length === 0) throw new Error("Tipo de movimentação 'codigo_promocional' não configurado.");
          const tipo = tipos[0];

          // 7. Calcular vencimento
          let dataExpiracao: string | null = null;
          const diasExp = codigo.dias_expiracao ?? tipo.dias_expiracao;
          if (diasExp) {
            const exp = new Date();
            exp.setDate(exp.getDate() + diasExp);
            dataExpiracao = exp.toISOString().slice(0, 10);
          }

          // 8. Calcular saldo_apos
          const [saldoRow]: any[] = await query(
            `SELECT COALESCE(SUM(xp), 0) AS total FROM xp_movimentacoes WHERE id_cliente = ?`,
            [clienteId]
          );
          const saldoApos = Number(saldoRow.total) + codigo.xp_bonus;

          // 9. Inserir movimentação
          await query(
            `INSERT INTO xp_movimentacoes
               (id_cliente, id_codigo, id_tipo_movimentacao, xp, saldo_apos, descricao)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [clienteId, codigo.id, tipo.id, codigo.xp_bonus, saldoApos,
              `Código promocional: ${codigoStr.trim().toUpperCase()}`]
          );

          // 10. Registrar uso
          await query(
            `INSERT INTO xp_codigos_usados (id_codigo, id_cliente) VALUES (?, ?)`,
            [codigo.id, clienteId]
          );

          // 11. Incrementar quantidade_usada
          await query(
            `UPDATE xp_codigos SET quantidade_usada = COALESCE(quantidade_usada, 0) + 1 WHERE id = ?`,
            [codigo.id]
          );

          // 12. Atualizar cache saldo_xp em xp_contas
          await query(
            `UPDATE xp_contas SET saldo_xp = ?, data_atualizacao = NOW() WHERE id_cliente = ?`,
            [saldoApos, clienteId]
          );

          return { xp: codigo.xp_bonus, descricao: `Código promocional: ${codigoStr.trim().toUpperCase()}`, saldoApos };
        })()
          .then((result) => {
            connection.commit((commitErr) => {
              connection.release();
              if (commitErr) reject(commitErr);
              else resolve(result);
            });
          })
          .catch((err) => {
            connection.rollback(() => {
              connection.release();
              reject(err);
            });
          });
      });
    });
  });
}

// ── XP Admin (XP Club) ───────────────────────────────────────────

async function getSaldoClienteAtual(clienteId: number): Promise<number> {
  const [row]: any[] = await executeQuery(
    `SELECT COALESCE(SUM(xp), 0) AS total FROM xp_movimentacoes WHERE id_cliente = ?`,
    [clienteId]
  );
  return Number(row?.total || 0);
}

async function ensureTipoMovimentacao(
  slug: string,
  nome: string,
  tipoOperacao: 'credito' | 'debito',
  qualificavel: boolean,
  descricao: string,
  diasExpiracao: number | null = null
): Promise<number> {
  const normalizedSlug = normalizeTipoSlug(slug);

  const rows: any[] = await executeQuery(
    `SELECT id FROM xp_tipos_movimentacao WHERE slug = ? LIMIT 1`,
    [normalizedSlug]
  );

  if (rows.length > 0) return Number(rows[0].id);

  const result: any = await executeQuery(
    `INSERT INTO xp_tipos_movimentacao
      (slug, nome, tipo_operacao, qualificavel, descricao, dias_expiracao)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [normalizedSlug, nome, tipoOperacao, qualificavel ? 1 : 0, descricao, diasExpiracao]
  );
  return Number(result.insertId);
}

export async function getXpAdminDashboardResumo() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Saldo do programa
  const [saldoRow]: any[] = await executeQuery(
    `SELECT COALESCE(SUM(xp), 0) AS total FROM xp_movimentacoes`
  );

  // Pontos qualificáveis em aberto (créditos qualificáveis válidos + débitos)
  const [qualRow]: any[] = await executeQuery(
    `SELECT COALESCE(SUM(m.xp), 0) AS total
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     WHERE t.tipo_operacao = 'debito'
       OR (t.tipo_operacao = 'credito' AND t.qualificavel = 1 AND (
         t.dias_expiracao IS NULL
         OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?
       ))`,
    [hoje]
  );

  // XP vencendo — mesma lógica da reconciliação (código > tipo > data_expiracao do código)
  const alertaDias = await getXpConfigNum('xp_alerta_vencimento_dias', 30);
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + alertaDias);

  const [expirarRow]: any[] = await executeQuery(
    `SELECT COALESCE(SUM(m.xp), 0) AS total
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     LEFT JOIN xp_codigos c ON c.id = m.id_codigo
     WHERE t.tipo_operacao = 'credito'
       AND (
         (c.dias_expiracao IS NOT NULL
           AND DATE_ADD(m.data_movimentacao, INTERVAL c.dias_expiracao DAY) >= ?
           AND DATE_ADD(m.data_movimentacao, INTERVAL c.dias_expiracao DAY) <= ?)
         OR (c.dias_expiracao IS NULL AND t.dias_expiracao IS NOT NULL
           AND DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?
           AND DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) <= ?)
         OR (c.dias_expiracao IS NULL AND t.dias_expiracao IS NULL
           AND c.data_expiracao IS NOT NULL
           AND c.data_expiracao >= ? AND c.data_expiracao <= ?)
       )`,
    [hoje, limite, hoje, limite, hoje, limite]
  );

  // Clientes aptos a resgatar (saldoResgatavel > 0)
  const xpMinimoResgate = await getXpConfigNum('xp_minimo_resgate', 0);
  // Precisa calcular por cliente: qualificável + (bonus se qualificável >= mínimo)
  const aptosRows: any[] = await executeQuery(
    `SELECT
       m.id_cliente,
       COALESCE(SUM(
         CASE
           WHEN t.tipo_operacao = 'debito' THEN m.xp
           WHEN t.tipo_operacao = 'credito' AND t.qualificavel = 1
             AND (t.dias_expiracao IS NULL OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?)
           THEN m.xp
           ELSE 0
         END
       ), 0) AS sq,
       COALESCE(SUM(
         CASE
           WHEN t.tipo_operacao = 'credito' AND (t.qualificavel = 0 OR t.qualificavel IS NULL)
             AND (t.dias_expiracao IS NULL OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?)
           THEN m.xp
           ELSE 0
         END
       ), 0) AS snq
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     GROUP BY m.id_cliente`,
    [hoje, hoje]
  );
  let clientesAptos = 0;
  for (const r of aptosRows) {
    const sq = Number(r.sq);
    const snq = Math.max(0, Number(r.snq));
    const bonus = (xpMinimoResgate > 0 ? sq >= xpMinimoResgate : true) ? snq : 0;
    const resgatavel = Math.max(0, sq) + bonus;
    if (resgatavel > 0) clientesAptos++;
  }

  return {
    saldoPrograma: Number(saldoRow?.total || 0),
    pontosQualificaveis: Math.max(0, Number(qualRow?.total || 0)),
    xpVencendo: Number(expirarRow?.total || 0),
    clientesAptosResgatar: clientesAptos,
    xpMinimoResgate,
  };
}

export async function getXpAdminDashboardPeriodo(days: number = 30) {
  const from = new Date();
  from.setDate(from.getDate() - Math.max(1, days));
  from.setHours(0, 0, 0, 0);

  // Créditos qualificáveis, não qualificáveis e débitos
  const [periodoRow]: any[] = await executeQuery(
    `SELECT
       COALESCE(SUM(CASE WHEN t.tipo_operacao = 'credito' AND t.qualificavel = 1 THEN m.xp ELSE 0 END), 0) AS creditos_qualificaveis,
       COALESCE(SUM(CASE WHEN t.tipo_operacao = 'credito' AND (t.qualificavel = 0 OR t.qualificavel IS NULL) THEN m.xp ELSE 0 END), 0) AS creditos_nao_qualificaveis,
       COALESCE(SUM(CASE WHEN t.tipo_operacao = 'debito' THEN ABS(m.xp) ELSE 0 END), 0) AS total_debito,
       COALESCE(SUM(CASE WHEN t.tipo_operacao = 'credito' THEN m.xp ELSE 0 END), 0) AS total_credito
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     WHERE m.data_movimentacao >= ?`,
    [from]
  );

  // Resgates do período (slug = 'resgate')
  const [resgateRow]: any[] = await executeQuery(
    `SELECT COALESCE(SUM(ABS(m.xp)), 0) AS total
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     WHERE t.slug = 'resgate' AND t.tipo_operacao = 'debito'
       AND m.data_movimentacao >= ?`,
    [from]
  );

  // Valor em reais equivalente
  const xpValorReais = await getXpConfigNum('xp_valor_reais', 0.10);

  const creditosQualificaveis = Number(periodoRow?.creditos_qualificaveis || 0);
  const creditosNaoQualificaveis = Number(periodoRow?.creditos_nao_qualificaveis || 0);
  const totalCredito = Number(periodoRow?.total_credito || 0);
  const totalDebito = Number(periodoRow?.total_debito || 0);
  const resgatesXp = Number(resgateRow?.total || 0);

  return {
    days,
    pontosQualificaveis: creditosQualificaveis,
    pontosNaoQualificaveis: creditosNaoQualificaveis,
    resgatesXp,
    resgatesReais: Math.round(resgatesXp * xpValorReais * 100) / 100,
    saldoLiquidoPeriodo: totalCredito - totalDebito,
  };
}

// ── Listas operacionais do dashboard ──────────────────────────────

export async function listXpAdminClientesAptosResgatar(limit: number = 20) {
  const hoje = new Date().toISOString().slice(0, 10);
  const xpMinimoResgate = await getXpConfigNum('xp_minimo_resgate', 0);
  const xpValorReais = await getXpConfigNum('xp_valor_reais', 0.10);

  const rows: any[] = await executeQuery(
    `SELECT c.id, c.nome, c.email, c.cpf,
       COALESCE(SUM(m.xp), 0) AS saldo_total,
       COALESCE(SUM(
         CASE
           WHEN t.tipo_operacao = 'debito' THEN m.xp
           WHEN t.tipo_operacao = 'credito' AND t.qualificavel = 1
             AND (t.dias_expiracao IS NULL OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?)
           THEN m.xp
           ELSE 0
         END
       ), 0) AS saldo_qualificavel,
       COALESCE(SUM(
         CASE
           WHEN t.tipo_operacao = 'credito' AND (t.qualificavel = 0 OR t.qualificavel IS NULL)
             AND (t.dias_expiracao IS NULL OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?)
           THEN m.xp
           ELSE 0
         END
       ), 0) AS saldo_nao_qualificavel
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     JOIN clientes c ON c.id = m.id_cliente
     GROUP BY c.id, c.nome, c.email, c.cpf`,
    [hoje, hoje]
  );

  const mapped = rows.map((r: any) => {
    const sq = Number(r.saldo_qualificavel);
    const snq = Math.max(0, Number(r.saldo_nao_qualificavel));
    const bonus = (xpMinimoResgate > 0 ? sq >= xpMinimoResgate : true) ? snq : 0;
    const resgatavel = Math.max(0, sq) + bonus;
    return {
      id: r.id,
      nome: r.nome,
      email: r.email,
      cpf: r.cpf,
      saldo_total: Number(r.saldo_total),
      saldo_qualificavel: sq,
      saldo_nao_qualificavel: snq,
      saldo_resgatavel: resgatavel,
      bonus_desbloqueado: bonus > 0,
      valor_estimado: Math.round(resgatavel * xpValorReais * 100) / 100,
      minimo_resgate: xpMinimoResgate,
    };
  });

  return mapped
    .filter(c => c.saldo_resgatavel > 0)
    .sort((a, b) => b.saldo_resgatavel - a.saldo_resgatavel)
    .slice(0, limit);
}

export async function listXpAdminTopQualificaveis(limit: number = 10) {
  const hoje = new Date().toISOString().slice(0, 10);
  const xpMinimoResgate = await getXpConfigNum('xp_minimo_resgate', 0);
  const xpValorReais = await getXpConfigNum('xp_valor_reais', 0.10);

  const rows: any[] = await executeQuery(
    `SELECT c.id, c.nome, c.email,
       COALESCE(SUM(m.xp), 0) AS saldo_total,
       COALESCE(SUM(
         CASE
           WHEN t.tipo_operacao = 'debito' THEN m.xp
           WHEN t.tipo_operacao = 'credito' AND t.qualificavel = 1
             AND (t.dias_expiracao IS NULL OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?)
           THEN m.xp
           ELSE 0
         END
       ), 0) AS saldo_qualificavel,
       COALESCE(SUM(
         CASE
           WHEN t.tipo_operacao = 'credito' AND (t.qualificavel = 0 OR t.qualificavel IS NULL)
             AND (t.dias_expiracao IS NULL OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?)
           THEN m.xp
           ELSE 0
         END
       ), 0) AS saldo_nao_qualificavel
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     JOIN clientes c ON c.id = m.id_cliente
     GROUP BY c.id, c.nome, c.email`,
    [hoje, hoje]
  );

  const mapped = rows.map((r: any) => {
    const sq = Number(r.saldo_qualificavel);
    const snq = Math.max(0, Number(r.saldo_nao_qualificavel));
    const bonus = (xpMinimoResgate > 0 ? sq >= xpMinimoResgate : true) ? snq : 0;
    const resgatavel = Math.max(0, sq) + bonus;
    return {
      id: r.id,
      nome: r.nome,
      email: r.email,
      saldo_total: Number(r.saldo_total),
      saldo_qualificavel: sq,
      saldo_resgatavel: resgatavel,
      valor_estimado: Math.round(resgatavel * xpValorReais * 100) / 100,
    };
  });

  return mapped
    .filter(c => c.saldo_resgatavel > 0)
    .sort((a, b) => b.saldo_resgatavel - a.saldo_resgatavel)
    .slice(0, limit);
}

export async function listXpAdminCodigosAVencer(diasAdiante: number = 30) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + diasAdiante);

  const rows: any[] = await executeQuery(
    `SELECT c.id, c.codigo, c.xp_bonus, c.quantidade_max_uso, c.quantidade_usada,
            c.data_expiracao, c.dias_expiracao, c.ativo,
            p.nome AS parceiro_nome,
            DATEDIFF(c.data_expiracao, CURDATE()) AS dias_restantes
     FROM xp_codigos c
     LEFT JOIN xp_parceiros p ON p.id = c.id_parceiro
     WHERE c.ativo = 1
       AND c.data_expiracao IS NOT NULL
       AND c.data_expiracao >= ?
       AND c.data_expiracao <= ?
     ORDER BY c.data_expiracao ASC
     LIMIT 20`,
    [hoje, limite]
  );
  return rows;
}

export async function listXpAdminClientes(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;
  const hoje = new Date().toISOString().slice(0, 10);

  let where = `WHERE 1=1`;
  const whereParams: any[] = [];

  if (params.search?.trim()) {
    const s = `%${params.search.trim()}%`;
    const cpfSearch = `%${params.search.trim().replace(/\D/g, '')}%`;
    where += ` AND (c.nome LIKE ? OR c.email LIKE ? OR CAST(c.cpf AS CHAR) LIKE ?)`;
    whereParams.push(s, s, cpfSearch);
  }

  const [countRow]: any[] = await executeQuery(
    `SELECT COUNT(*) AS total FROM clientes c ${where}`,
    whereParams
  );

  const xpMinimoResgate = await getXpConfigNum('xp_minimo_resgate', 0);

  const rows: any[] = await executeQuery(
    `SELECT c.id, c.nome, c.email, c.cpf,
            COALESCE(SUM(m.xp), 0) AS saldo_xp,
            COALESCE(SUM(
              CASE
                WHEN t.tipo_operacao = 'debito' THEN m.xp
                WHEN t.tipo_operacao = 'credito'
                  AND t.qualificavel = 1
                  AND (t.dias_expiracao IS NULL
                    OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?)
                THEN m.xp
                ELSE 0
              END
            ), 0) AS saldo_qualificavel,
            COALESCE(SUM(
              CASE
                WHEN t.tipo_operacao = 'credito'
                  AND (t.qualificavel = 0 OR t.qualificavel IS NULL)
                  AND (t.dias_expiracao IS NULL
                    OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?)
                THEN m.xp
                ELSE 0
              END
            ), 0) AS saldo_nao_qualificavel,
            MAX(m.data_movimentacao) AS ultima_movimentacao
     FROM clientes c
     LEFT JOIN xp_movimentacoes m ON m.id_cliente = c.id
     LEFT JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     ${where}
     GROUP BY c.id, c.nome, c.email, c.cpf
     ORDER BY c.nome ASC
     LIMIT ? OFFSET ?`,
    [...whereParams, hoje, hoje, String(pageSize), String(offset)]
  );

  const items = rows.map((r: any) => {
    const sq = Number(r.saldo_qualificavel);
    const snq = Math.max(0, Number(r.saldo_nao_qualificavel));
    const bonus = (xpMinimoResgate > 0 ? sq >= xpMinimoResgate : true) ? snq : 0;
    const resgatavel = Math.max(0, sq) + bonus;
    return {
      ...r,
      saldo_qualificavel: sq,
      saldo_nao_qualificavel: snq,
      saldo_resgatavel: resgatavel,
      bonus_desbloqueado: bonus > 0,
    };
  });

  return {
    items,
    total: Number(countRow?.total || 0),
    page,
    pageSize,
    totalPages: Math.ceil(Number(countRow?.total || 0) / pageSize),
  };
}

async function calcSaldoResgate(clienteId: number) {
  const hoje = new Date().toISOString().slice(0, 10);
  const xpMinimoResgate = await getXpConfigNum('xp_minimo_resgate', 0);

  // Saldo qualificável: créditos qualificáveis válidos + todos débitos
  const [qualRow]: any[] = await executeQuery(
    `SELECT COALESCE(SUM(m.xp), 0) AS total
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     WHERE m.id_cliente = ?
       AND (
         t.tipo_operacao = 'debito'
         OR (t.tipo_operacao = 'credito' AND t.qualificavel = 1 AND (
           t.dias_expiracao IS NULL
           OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?
         ))
       )`,
    [clienteId, hoje]
  );
  const saldoQualificavel = Number(qualRow?.total || 0);

  // Saldo não qualificável: créditos não qualificáveis válidos
  const [naoQualRow]: any[] = await executeQuery(
    `SELECT COALESCE(SUM(m.xp), 0) AS total
     FROM xp_movimentacoes m
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     WHERE m.id_cliente = ?
       AND t.tipo_operacao = 'credito'
       AND (t.qualificavel = 0 OR t.qualificavel IS NULL)
       AND (t.dias_expiracao IS NULL OR DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) >= ?)`,
    [clienteId, hoje]
  );
  const saldoNaoQualificavel = Math.max(0, Number(naoQualRow?.total || 0));

  const bonusDesbloqueado = xpMinimoResgate > 0
    ? saldoQualificavel >= xpMinimoResgate
    : true;
  const saldoResgatavel = Math.max(0, saldoQualificavel) + (bonusDesbloqueado ? saldoNaoQualificavel : 0);

  return {
    saldoQualificavel,
    saldoNaoQualificavel,
    bonusDesbloqueado,
    saldoResgatavel,
    xpMinimoResgate,
  };
}

async function getSaldoQualificavelCliente(clienteId: number) {
  const r = await calcSaldoResgate(clienteId);
  return r.saldoResgatavel;
}

export async function listXpAdminMovimentacoes(params: {
  search?: string;
  tipoOperacao?: 'credito' | 'debito';
  tipoMovimentacaoId?: number;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let where = `WHERE 1=1`;
  const sqlParams: any[] = [];

  if (params.search?.trim()) {
    const s = `%${params.search.trim()}%`;
    const cpfSearch = `%${params.search.trim().replace(/\D/g, '')}%`;
    where += ` AND (c.nome LIKE ? OR c.email LIKE ? OR CAST(c.cpf AS CHAR) LIKE ? OR m.descricao LIKE ?)`;
    sqlParams.push(s, s, cpfSearch, s);
  }
  if (params.tipoOperacao) {
    where += ` AND t.tipo_operacao = ?`;
    sqlParams.push(params.tipoOperacao);
  }
  if (params.tipoMovimentacaoId) {
    where += ` AND m.id_tipo_movimentacao = ?`;
    sqlParams.push(params.tipoMovimentacaoId);
  }
  if (params.dataInicio) {
    where += ` AND m.data_movimentacao >= ?`;
    sqlParams.push(params.dataInicio);
  }
  if (params.dataFim) {
    where += ` AND m.data_movimentacao <= ?`;
    sqlParams.push(`${params.dataFim} 23:59:59`);
  }

  const [countRow]: any[] = await executeQuery(
    `SELECT COUNT(*) AS total
     FROM xp_movimentacoes m
     JOIN clientes c ON c.id = m.id_cliente
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     ${where}`,
    sqlParams
  );

  const rows: any[] = await executeQuery(
    `SELECT m.id, m.id_cliente, c.nome AS cliente_nome, c.email AS cliente_email,
            m.id_users, u.name AS admin_nome,
            m.id_codigo, cd.codigo,
            m.id_tipo_movimentacao, t.nome AS tipo_nome, t.tipo_operacao,
            m.xp, m.saldo_apos, m.descricao, m.codigo_ref, m.data_compra, m.valor_referencia, m.data_movimentacao,
            DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) AS data_expiracao
     FROM xp_movimentacoes m
     JOIN clientes c ON c.id = m.id_cliente
     JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
     LEFT JOIN users u ON u.id = m.id_users
     LEFT JOIN xp_codigos cd ON cd.id = m.id_codigo
     ${where}
     ORDER BY m.data_movimentacao DESC
     LIMIT ? OFFSET ?`,
    [...sqlParams, String(pageSize), String(offset)]
  );

  return {
    items: rows,
    total: Number(countRow?.total || 0),
    page,
    pageSize,
    totalPages: Math.ceil(Number(countRow?.total || 0) / pageSize),
  };
}

export async function registrarXpCompraManual(input: {
  clienteId: number;
  userId: number;
  tipoMovimentacaoId: number;
  xpManual: number;
  valorReais?: number;
  dataCompra?: string;
  codigoRef?: string;
  descricao?: string;
}) {
  await getOrCreateXpConta(input.clienteId);

  const tipoRows = await executeQuery(
    `SELECT id, tipo_operacao, nome, exibir_no_lancamento_manual FROM xp_tipos_movimentacao WHERE id = ? LIMIT 1`,
    [input.tipoMovimentacaoId]
  );
  const tipoSelecionado = (tipoRows as any[])[0];
  if (!tipoSelecionado) {
    throw new Error('Tipo de movimentação inválido.');
  }
  if (!tipoSelecionado.exibir_no_lancamento_manual) {
    throw new Error('Tipo de movimentação não disponível para lançamento manual.');
  }

  const xpBase = Math.abs(Math.round(input.xpManual));
  if (!Number.isFinite(xpBase) || xpBase <= 0) {
    throw new Error('XP manual inválido.');
  }

  const isDebito = tipoSelecionado.tipo_operacao === 'debito';
  if (isDebito) {
    const resgate = await calcSaldoResgate(input.clienteId);
    if (xpBase > resgate.saldoResgatavel) {
      throw new Error(`XP informado (${xpBase}) excede o saldo resgatável do cliente (${resgate.saldoResgatavel}).`);
    }
  }
  const xpGerado = isDebito ? -xpBase : xpBase;

  const saldoAtual = await getSaldoClienteAtual(input.clienteId);
  const saldoApos = saldoAtual + xpGerado;

  await executeQuery(
    `INSERT INTO xp_movimentacoes
      (id_cliente, id_users, id_tipo_movimentacao, xp, saldo_apos, descricao, valor_referencia, data_compra, codigo_ref)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.clienteId,
      input.userId,
      input.tipoMovimentacaoId,
      xpGerado,
      saldoApos,
      input.descricao?.trim() || 'Lançamento manual registrado no admin',
      input.valorReais ?? null,
      input.dataCompra || null,
      input.codigoRef?.trim() || null,
    ]
  );

  await executeQuery(
    `UPDATE xp_contas SET saldo_xp = ?, data_atualizacao = NOW() WHERE id_cliente = ?`,
    [saldoApos, input.clienteId]
  );

  return { xpGerado, saldoApos, tipoOperacao: tipoSelecionado.tipo_operacao };
}

export async function listXpAdminCodigos() {
  return await executeQuery(
    `SELECT c.id, c.id_parceiro, p.nome AS parceiro_nome,
            c.codigo, c.xp_bonus, c.quantidade_max_uso, c.quantidade_usada,
            c.data_expiracao, c.ativo, c.data_criacao, c.dias_expiracao
     FROM xp_codigos c
     LEFT JOIN xp_parceiros p ON p.id = c.id_parceiro
     ORDER BY c.data_criacao DESC`
  );
}

function validarRegraVencimentoCodigo(dataExpiracao?: string | null, diasExpiracao?: number | null) {
  const hasData = !!dataExpiracao;
  const hasDias = diasExpiracao !== null && diasExpiracao !== undefined;
  if (hasData && hasDias) {
    throw new Error('Informe apenas uma regra de vencimento: Data de validade do codigo OU Dias de vencimento do XP.');
  }
}

export async function createXpAdminCodigo(input: {
  idParceiro?: number | null;
  codigo: string;
  xpBonus: number;
  quantidadeMaxUso?: number | null;
  dataExpiracao?: string | null;
  ativo?: boolean;
  diasExpiracao?: number | null;
}) {
  validarRegraVencimentoCodigo(input.dataExpiracao ?? null, input.diasExpiracao ?? null);

  const result: any = await executeQuery(
    `INSERT INTO xp_codigos
      (id_parceiro, codigo, xp_bonus, quantidade_max_uso, quantidade_usada, data_expiracao, ativo, dias_expiracao)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
    [
      input.idParceiro ?? null,
      input.codigo.trim().toUpperCase(),
      input.xpBonus,
      input.quantidadeMaxUso ?? null,
      input.dataExpiracao ?? null,
      input.ativo === false ? 0 : 1,
      input.diasExpiracao ?? null,
    ]
  );
  return { insertId: Number(result.insertId) };
}

export async function updateXpAdminCodigo(input: {
  id: number;
  idParceiro?: number | null;
  codigo?: string;
  xpBonus?: number;
  quantidadeMaxUso?: number | null;
  dataExpiracao?: string | null;
  ativo?: boolean;
  diasExpiracao?: number | null;
}) {
  // Merge partial updates with current row before validating exclusivity.
  const rows: any[] = await executeQuery(
    `SELECT data_expiracao, dias_expiracao FROM xp_codigos WHERE id = ? LIMIT 1`,
    [input.id]
  );
  if (rows.length === 0) {
    throw new Error('Codigo promocional nao encontrado.');
  }
  const current = rows[0];
  const nextDataExpiracao = input.dataExpiracao !== undefined ? input.dataExpiracao : (current.data_expiracao ?? null);
  const nextDiasExpiracao = input.diasExpiracao !== undefined ? input.diasExpiracao : (current.dias_expiracao ?? null);
  validarRegraVencimentoCodigo(nextDataExpiracao, nextDiasExpiracao);

  const sets: string[] = [];
  const values: any[] = [];

  if (input.idParceiro !== undefined) { sets.push(`id_parceiro = ?`); values.push(input.idParceiro); }
  if (input.codigo !== undefined) { sets.push(`codigo = ?`); values.push(input.codigo.trim().toUpperCase()); }
  if (input.xpBonus !== undefined) { sets.push(`xp_bonus = ?`); values.push(input.xpBonus); }
  if (input.quantidadeMaxUso !== undefined) { sets.push(`quantidade_max_uso = ?`); values.push(input.quantidadeMaxUso); }
  if (input.dataExpiracao !== undefined) { sets.push(`data_expiracao = ?`); values.push(input.dataExpiracao); }
  if (input.ativo !== undefined) { sets.push(`ativo = ?`); values.push(input.ativo ? 1 : 0); }
  if (input.diasExpiracao !== undefined) { sets.push(`dias_expiracao = ?`); values.push(input.diasExpiracao); }

  if (sets.length === 0) return { success: true };

  values.push(input.id);
  await executeQuery(`UPDATE xp_codigos SET ${sets.join(', ')} WHERE id = ?`, values);
  return { success: true };
}

export async function toggleXpAdminCodigo(id: number, ativo: boolean) {
  await executeQuery(`UPDATE xp_codigos SET ativo = ? WHERE id = ?`, [ativo ? 1 : 0, id]);
  return { success: true };
}

export async function listXpAdminParceiros() {
  return await executeQuery(
    `SELECT id, nome, email, telefone, observacoes, data_criacao
     FROM xp_parceiros
     ORDER BY nome ASC`
  );
}

export async function createXpAdminParceiro(input: {
  nome: string;
  email?: string | null;
  telefone?: string | null;
  observacoes?: string | null;
}) {
  const result: any = await executeQuery(
    `INSERT INTO xp_parceiros (nome, email, telefone, observacoes)
     VALUES (?, ?, ?, ?)`,
    [input.nome.trim(), input.email ?? null, input.telefone ?? null, input.observacoes ?? null]
  );
  return { insertId: Number(result.insertId) };
}

export async function updateXpAdminParceiro(input: {
  id: number;
  nome?: string;
  email?: string | null;
  telefone?: string | null;
  observacoes?: string | null;
}) {
  const sets: string[] = [];
  const values: any[] = [];

  if (input.nome !== undefined) { sets.push(`nome = ?`); values.push(input.nome.trim()); }
  if (input.email !== undefined) { sets.push(`email = ?`); values.push(input.email); }
  if (input.telefone !== undefined) { sets.push(`telefone = ?`); values.push(input.telefone); }
  if (input.observacoes !== undefined) { sets.push(`observacoes = ?`); values.push(input.observacoes); }

  if (sets.length === 0) return { success: true };

  values.push(input.id);
  await executeQuery(`UPDATE xp_parceiros SET ${sets.join(', ')} WHERE id = ?`, values);
  return { success: true };
}

export async function deleteXpAdminParceiro(id: number) {
  await executeQuery(`DELETE FROM xp_parceiros WHERE id = ?`, [id]);
  return { success: true };
}

export async function listXpAdminConfiguracoes() {
  return await executeQuery(
    `SELECT id, chave, valor, descricao, created_at, updated_at
     FROM xp_configuracoes
     ORDER BY chave ASC`
  );
}

export async function upsertXpAdminConfiguracao(input: {
  chave: string;
  valor: string;
  descricao?: string | null;
}) {
  await executeQuery(
    `INSERT INTO xp_configuracoes (chave, valor, descricao)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       valor = VALUES(valor),
       descricao = VALUES(descricao),
       updated_at = NOW()`,
    [input.chave.trim(), input.valor.trim(), input.descricao ?? null]
  );
  return { success: true };
}

// ── Reconciliação automática de vencimento XP (por cliente) ───────

export async function reconciliarVencimentoXpCliente(clienteId: number): Promise<void> {
  if (!_pool) {
    await getDb();
    if (!_pool) throw new Error('Database not available');
  }

  return new Promise<void>((resolve, reject) => {
    _pool!.getConnection((connErr, connection) => {
      if (connErr || !connection) {
        reject(connErr || new Error('Failed to get DB connection'));
        return;
      }

      connection.beginTransaction((txErr) => {
        if (txErr) { connection.release(); reject(txErr); return; }

        const query = (sql: string, params: any[] = []): Promise<any> =>
          new Promise((res, rej) => {
            connection.execute(sql, params, (err, results) => {
              if (err) rej(err); else res(results);
            });
          });

        (async () => {
          // Lock the client's xp_contas row to prevent concurrent reconciliation
          await query(
            `SELECT id FROM xp_contas WHERE id_cliente = ? FOR UPDATE`,
            [clienteId]
          );

          // Ensure the 'vencimento' tipo exists
          let tipoRows: any[] = await query(
            `SELECT id FROM xp_tipos_movimentacao WHERE slug = 'vencimento' LIMIT 1`
          );
          let tipoVencimentoId: number;
          if (tipoRows.length > 0) {
            tipoVencimentoId = Number(tipoRows[0].id);
          } else {
            const ins: any = await query(
              `INSERT INTO xp_tipos_movimentacao (slug, nome, tipo_operacao, qualificavel, exibir_no_lancamento_manual, descricao)
               VALUES ('vencimento', 'Vencimento', 'debito', 0, 0, 'Baixa automática por vencimento de XP')`,
            );
            tipoVencimentoId = Number(ins.insertId);
          }

          // Sum all expired credits for this client
          const [expRow]: any[] = await query(
            `SELECT COALESCE(SUM(m.xp), 0) AS expirado_total
             FROM xp_movimentacoes m
             JOIN xp_tipos_movimentacao t ON t.id = m.id_tipo_movimentacao
             LEFT JOIN xp_codigos c ON c.id = m.id_codigo
             WHERE m.id_cliente = ?
               AND t.tipo_operacao = 'credito'
               AND (
                 (c.dias_expiracao IS NOT NULL AND DATE_ADD(m.data_movimentacao, INTERVAL c.dias_expiracao DAY) < CURDATE())
                 OR (c.dias_expiracao IS NULL AND t.dias_expiracao IS NOT NULL AND DATE_ADD(m.data_movimentacao, INTERVAL t.dias_expiracao DAY) < CURDATE())
                 OR (c.data_expiracao IS NOT NULL AND DATE(c.data_expiracao) < CURDATE())
               )`,
            [clienteId]
          );
          const expiradoTotal = Number(expRow?.expirado_total || 0);
          if (expiradoTotal <= 0) return; // nothing expired

          // Sum already debited by vencimento for this client
          const [debRow]: any[] = await query(
            `SELECT COALESCE(ABS(SUM(m.xp)), 0) AS debitado_total
             FROM xp_movimentacoes m
             WHERE m.id_cliente = ? AND m.id_tipo_movimentacao = ?`,
            [clienteId, tipoVencimentoId]
          );
          const debitadoTotal = Number(debRow?.debitado_total || 0);

          const pendente = Math.max(expiradoTotal - debitadoTotal, 0);
          if (pendente <= 0) return; // already reconciled

          // Calculate current balance
          const [saldoRow]: any[] = await query(
            `SELECT COALESCE(SUM(xp), 0) AS total FROM xp_movimentacoes WHERE id_cliente = ?`,
            [clienteId]
          );
          const saldoApos = Number(saldoRow.total) - pendente;

          // Insert vencimento debit
          await query(
            `INSERT INTO xp_movimentacoes
              (id_cliente, id_tipo_movimentacao, xp, saldo_apos, descricao)
             VALUES (?, ?, ?, ?, 'Baixa automática por vencimento de XP')`,
            [clienteId, tipoVencimentoId, -pendente, saldoApos]
          );

          // Update cached balance
          await query(
            `UPDATE xp_contas SET saldo_xp = ?, data_atualizacao = NOW() WHERE id_cliente = ?`,
            [saldoApos, clienteId]
          );
        })()
          .then(() => {
            connection.commit((commitErr) => {
              connection.release();
              if (commitErr) reject(commitErr);
              else resolve();
            });
          })
          .catch((err) => {
            connection.rollback(() => {
              connection.release();
              reject(err);
            });
          });
      });
    });
  });
}

