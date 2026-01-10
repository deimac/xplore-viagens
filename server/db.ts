import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, travels, InsertTravel, categories, InsertCategory, travelCategories, quotations, InsertQuotation, companySettings, InsertCompanySettings, heroSlides, InsertHeroSlide, reviewAuthors, reviews, InsertReviewAuthor, InsertReview } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

// Review Authors queries
export async function upsertReviewAuthor(author: InsertReviewAuthor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if author exists
  const existing = await db.select().from(reviewAuthors).where(eq(reviewAuthors.googleId, author.googleId)).limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db.update(reviewAuthors)
      .set({ name: author.name, email: author.email, avatarUrl: author.avatarUrl })
      .where(eq(reviewAuthors.googleId, author.googleId));
    return existing[0];
  } else {
    // Insert new
    const result = await db.insert(reviewAuthors).values(author);
    const newAuthor = await db.select().from(reviewAuthors).where(eq(reviewAuthors.googleId, author.googleId)).limit(1);
    return newAuthor[0];
  }
}

export async function getReviewAuthorByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reviewAuthors).where(eq(reviewAuthors.googleId, googleId)).limit(1);
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
