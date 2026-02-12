import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, primaryKey } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories table
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Travels table
 */
export const travels = mysqlTable("travels", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  origin: varchar("origin", { length: 255 }).notNull(),
  departureDate: varchar("departureDate", { length: 50 }),
  returnDate: varchar("returnDate", { length: 50 }),
  travelers: varchar("travelers", { length: 100 }),
  price: varchar("price", { length: 100 }).notNull(),
  imageUrl: text("imageUrl"),
  promotion: varchar("promotion", { length: 30 }),
  promotionColor: varchar("promotionColor", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Travel = typeof travels.$inferSelect;
export type InsertTravel = typeof travels.$inferInsert;

/**
 * Travel Categories junction table (many-to-many)
 */
export const travelCategories = mysqlTable(
  "travelCategories",
  {
    travelId: int("travelId")
      .notNull()
      .references(() => travels.id, { onDelete: "cascade" }),
    categoryId: int("categoryId")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.travelId, table.categoryId] }),
  })
);

export type TravelCategory = typeof travelCategories.$inferSelect;
export type InsertTravelCategory = typeof travelCategories.$inferInsert;

/**
 * Quotations table - for travel quote requests
 */
export const quotations = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  destination: varchar("destination", { length: 255 }).notNull(),
  departureDate: varchar("departureDate", { length: 50 }),
  returnDate: varchar("returnDate", { length: 50 }),
  travelers: int("travelers").notNull(),
  budget: varchar("budget", { length: 100 }),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "contacted", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

/**
 * Company Settings table - stores company information
 */
export const companySettings = mysqlTable("companySettings", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }),
  foundedDate: varchar("foundedDate", { length: 50 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  instagram: varchar("instagram", { length: 255 }),
  facebook: varchar("facebook", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  twitter: varchar("twitter", { length: 255 }),
  quotationLink: text("quotationLink"),
  googleAnalyticsId: varchar("googleAnalyticsId", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;

/**
 * Hero Slides table - stores slides for the hero carousel
 */
export const heroSlides = mysqlTable("heroSlides", {
  id: int("id").autoincrement().primaryKey(),
  imageUrl: text("imageUrl").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  order: int("order").notNull().default(0),
  isActive: int("isActive").notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HeroSlide = typeof heroSlides.$inferSelect;
export type InsertHeroSlide = typeof heroSlides.$inferInsert;

/**
 * Ofertas de Voo (premium)
 */
export const ofertasVoo = mysqlTable("ofertas_voo", {
  id: int("id").autoincrement().primaryKey(),
  tipoOferta: mysqlEnum("tipo_oferta", ["DATA_FIXA", "DATA_FLEXIVEL"]).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  origemPrincipal: varchar("origem_principal", { length: 255 }),
  destinosResumo: varchar("destinos_resumo", { length: 255 }),
  companhiaAerea: varchar("companhia_aerea", { length: 255 }).notNull(),
  classe: mysqlEnum("classe", ["PE", "BS", "FC"]).notNull(),
  preco: varchar("preco", { length: 50 }).notNull(),
  parcelas: varchar("parcelas", { length: 50 }),
  rotasFixas: text("rotas_fixas"),
  rotaIda: text("rota_ida"),
  rotaVolta: text("rota_volta"),
  ativo: int("ativo").notNull().default(1),
  criadoEm: timestamp("criado_em"),
});

export const ofertasDatasFixas = mysqlTable("ofertas_datas_fixas", {
  id: int("id").autoincrement().primaryKey(),
  ofertaId: int("oferta_id").notNull(),
  datas: text("datas").notNull(),
});

export const ofertasDatasFlexiveis = mysqlTable("ofertas_datas_flexiveis", {
  id: int("id").autoincrement().primaryKey(),
  ofertaId: int("oferta_id").notNull(),
  tipo: mysqlEnum("tipo", ["IDA", "VOLTA"]).notNull(),
  mes: varchar("mes", { length: 10 }).notNull(),
  dias: text("dias").notNull(),
});

export type OfertaVoo = typeof ofertasVoo.$inferSelect;
export type OfertaDataFixa = typeof ofertasDatasFixas.$inferSelect;
export type OfertaDataFlexivel = typeof ofertasDatasFlexiveis.$inferSelect;

/**
 * Review Authors table - stores Google OAuth user data for reviews
 */
export const reviewAuthors = mysqlTable("reviewAuthors", {
  id: int("id").autoincrement().primaryKey(),
  googleId: varchar("googleId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewAuthor = typeof reviewAuthors.$inferSelect;
export type InsertReviewAuthor = typeof reviewAuthors.$inferInsert;

/**
 * Reviews table - stores client reviews with Google OAuth authentication
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId")
    .notNull()
    .references(() => reviewAuthors.id, { onDelete: "cascade" }),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  travelCategories: many(travelCategories),
}));

export const travelsRelations = relations(travels, ({ many }) => ({
  travelCategories: many(travelCategories),
}));

export const travelCategoriesRelations = relations(
  travelCategories,
  ({ one }) => ({
    travel: one(travels, {
      fields: [travelCategories.travelId],
      references: [travels.id],
    }),
    category: one(categories, {
      fields: [travelCategories.categoryId],
      references: [categories.id],
    }),
  })
);

export const reviewAuthorsRelations = relations(reviewAuthors, ({ many }) => ({
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  author: one(reviewAuthors, {
    fields: [reviews.authorId],
    references: [reviewAuthors.id],
  }),
}));

/**
 * Room Types table - Tipos de quartos (Quarto, Suíte, Sala, etc)
 */
export const roomTypes = mysqlTable("room_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 32 }),
});

export type RoomType = typeof roomTypes.$inferSelect;
export type InsertRoomType = typeof roomTypes.$inferInsert;

/**
 * Bed Types table - Tipos de camas (Solteiro, Casal, Queen, King, etc)
 */
export const bedTypes = mysqlTable("bed_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  sleepsCount: int("sleeps").notNull().default(1),
});

export type BedType = typeof bedTypes.$inferSelect;
export type InsertBedType = typeof bedTypes.$inferInsert;

/**
 * Property Rooms table - Quartos de cada propriedade
 */
export const propertyRooms = mysqlTable("property_rooms", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  roomTypeId: int("room_type_id").notNull(),
  name: varchar("name", { length: 255 }),
  displayOrder: int("display_order").notNull().default(0),
});

export type PropertyRoom = typeof propertyRooms.$inferSelect;
export type InsertPropertyRoom = typeof propertyRooms.$inferInsert;

/**
 * Room Beds table - Camas em cada quarto
 */
export const roomBeds = mysqlTable("room_beds", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("room_id").notNull(),
  bedTypeId: int("bed_type_id").notNull(),
  quantity: int("quantity").notNull().default(1),
});

export type RoomBed = typeof roomBeds.$inferSelect;
export type InsertRoomBed = typeof roomBeds.$inferInsert;

/**
 * Relations for rooms and beds
 */
export const roomTypesRelations = relations(roomTypes, ({ many }) => ({
  propertyRooms: many(propertyRooms),
}));

export const bedTypesRelations = relations(bedTypes, ({ many }) => ({
  roomBeds: many(roomBeds),
}));

export const propertyRoomsRelations = relations(propertyRooms, ({ one, many }) => ({
  roomType: one(roomTypes, {
    fields: [propertyRooms.roomTypeId],
    references: [roomTypes.id],
  }),
  beds: many(roomBeds),
}));

export const roomBedsRelations = relations(roomBeds, ({ one }) => ({
  room: one(propertyRooms, {
    fields: [roomBeds.roomId],
    references: [propertyRooms.id],
  }),
  bedType: one(bedTypes, {
    fields: [roomBeds.bedTypeId],
    references: [bedTypes.id],
  }),
}));
