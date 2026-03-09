import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, primaryKey, date, decimal, boolean } from "drizzle-orm/mysql-core";
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
 * Viagens table (new structure)
 */
export const viagens = mysqlTable("viagens", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  descricao: text("descricao").notNull(),
  tipoViagem: mysqlEnum("tipo_viagem", ["pacote", "hospedagem"]).notNull().default("pacote"),
  origem: varchar("origem", { length: 120 }),
  dataIda: date("dataIda"),
  dataVolta: date("dataVolta"),
  quantidadePessoas: int("quantidadePessoas").notNull().default(1),
  valorTotal: decimal("valorTotal", { precision: 10, scale: 2 }).notNull(),
  quantidadeParcelas: int("quantidadeParcelas"),
  valorParcela: decimal("valorParcela", { precision: 10, scale: 2 }),
  temJuros: boolean("temJuros").default(false),
  xp: int("xp").default(0),
  hospedagem: text("hospedagem"),
  tipoQuarto: varchar("tipo_quarto", { length: 80 }),
  imagemUrl: text("imagemUrl").notNull(),
  dataExpiracao: date("data_expiracao"),
  ativo: boolean("ativo").default(true),
  criadoEm: timestamp("criadoEm").defaultNow(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow(),
});

export type Viagem = typeof viagens.$inferSelect;
export type InsertViagem = typeof viagens.$inferInsert;

/**
 * Categorias table (new structure)
 */
export const categorias = mysqlTable("categorias", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  criadoEm: timestamp("criadoEm").defaultNow(),
});

export type Categoria = typeof categorias.$inferSelect;
export type InsertCategoria = typeof categorias.$inferInsert;

/**
 * ViagemCategorias junction table (N:N)
 */
export const viagemCategorias = mysqlTable(
  "viagemCategorias",
  {
    viagemId: int("viagemId")
      .notNull()
      .references(() => viagens.id, { onDelete: "cascade" }),
    categoriaId: int("categoriaId")
      .notNull()
      .references(() => categorias.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.viagemId, table.categoriaId] }),
  })
);

/**
 * Destaques table (tags do topo do card)
 */
export const destaques = mysqlTable("destaques", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 60 }).notNull(),
  criadoEm: timestamp("criadoEm").defaultNow(),
});

export type Destaque = typeof destaques.$inferSelect;
export type InsertDestaque = typeof destaques.$inferInsert;

/**
 * ViagemDestaques junction table (N:N)
 */
export const viagemDestaques = mysqlTable(
  "viagemDestaques",
  {
    viagemId: int("viagemId")
      .notNull()
      .references(() => viagens.id, { onDelete: "cascade" }),
    destaqueId: int("destaqueId")
      .notNull()
      .references(() => destaques.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.viagemId, table.destaqueId] }),
  })
);

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
 * Review Authors table - stores OAuth user data for reviews (Google / Facebook / etc.)
 * providerId = external ID from the OAuth provider (Google sub, Facebook ID, etc.)
 * loginMethod = identifies which provider was used ("google" | "facebook")
 */
export const reviewAuthors = mysqlTable("reviewAuthors", {
  id: int("id").autoincrement().primaryKey(),
  providerId: varchar("providerId", { length: 255 }).notNull().unique(),
  loginMethod: varchar("loginMethod", { length: 32 }).default("google").notNull(),
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

// ─────────────────────────────────────────────────────────────
// ÁREA DO CLIENTE / FIDELIDADE XP
// ─────────────────────────────────────────────────────────────

/**
 * Clientes table – perfil do cliente (independente de users admin)
 */
export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 150 }),
  email: varchar("email", { length: 150 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  senha: varchar("senha", { length: 255 }),
  cpf: varchar("cpf", { length: 14 }),
  telefone: varchar("telefone", { length: 20 }),
  cep: varchar("cep", { length: 10 }),
  endereco: varchar("endereco", { length: 255 }),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 100 }),
  bairro: varchar("bairro", { length: 100 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  googleId: varchar("google_id", { length: 255 }),
  facebookId: varchar("facebook_id", { length: 255 }),
  cadastroCompleto: boolean("cadastro_completo").default(false),
  origemCadastro: varchar("origem_cadastro", { length: 50 }),
  dataCriacao: timestamp("data_criacao").defaultNow(),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

/**
 * XP Contas – conta de pontos do cliente
 */
export const xpContas = mysqlTable("xp_contas", {
  id: int("id").autoincrement().primaryKey(),
  idCliente: int("id_cliente").notNull().references(() => clientes.id),
  saldoXp: int("saldo_xp").notNull().default(0),
  dataAtualizacao: timestamp("data_atualizacao"),
});

export type XpConta = typeof xpContas.$inferSelect;
export type InsertXpConta = typeof xpContas.$inferInsert;

/**
 * XP Parceiros – parceiros de códigos promocionais
 */
export const xpParceiros = mysqlTable("xp_parceiros", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }),
  telefone: varchar("telefone", { length: 20 }),
  observacoes: text("observacoes"),
  dataCriacao: timestamp("data_criacao").defaultNow(),
});

export type XpParceiro = typeof xpParceiros.$inferSelect;

/**
 * XP Tipos de Movimentação
 */
export const xpTiposMovimentacao = mysqlTable("xp_tipos_movimentacao", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 50 }).notNull(),
  tipoOperacao: mysqlEnum("tipo_operacao", ["credito", "debito", "ajuste"]).notNull(),
  qualificavel: boolean("qualificavel").notNull().default(false),
  descricao: varchar("descricao", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  diasExpiracao: int("dias_expiracao"),
});

export type XpTipoMovimentacao = typeof xpTiposMovimentacao.$inferSelect;

/**
 * XP Códigos promocionais
 */
export const xpCodigos = mysqlTable("xp_codigos", {
  id: int("id").autoincrement().primaryKey(),
  idParceiro: int("id_parceiro").references(() => xpParceiros.id),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  xpBonus: int("xp_bonus").notNull(),
  quantidadeMaxUso: int("quantidade_max_uso"),
  quantidadeUsada: int("quantidade_usada").default(0),
  dataExpiracao: timestamp("data_expiracao"),
  ativo: boolean("ativo").default(true),
  dataCriacao: timestamp("data_criacao").defaultNow(),
  diasExpiracao: int("dias_expiracao"),
});

export type XpCodigo = typeof xpCodigos.$inferSelect;

/**
 * XP Códigos Usados (registro de uso por cliente)
 */
export const xpCodigosUsados = mysqlTable("xp_codigos_usados", {
  id: int("id").autoincrement().primaryKey(),
  idCodigo: int("id_codigo").notNull().references(() => xpCodigos.id),
  idCliente: int("id_cliente").notNull().references(() => clientes.id),
  dataUso: timestamp("data_uso").defaultNow(),
});

export type XpCodigoUsado = typeof xpCodigosUsados.$inferSelect;

/**
 * XP Movimentações – ledger imutável de pontos
 */
export const xpMovimentacoes = mysqlTable("xp_movimentacoes", {
  id: int("id").autoincrement().primaryKey(),
  idCliente: int("id_cliente").notNull().references(() => clientes.id),
  idUsers: int("id_users").references(() => users.id),
  idCodigo: int("id_codigo").references(() => xpCodigos.id),
  idTipoMovimentacao: int("id_tipo_movimentacao").notNull().references(() => xpTiposMovimentacao.id),
  xp: int("xp").notNull(),
  saldoApos: int("saldo_apos"),
  descricao: varchar("descricao", { length: 255 }),
  valorReferencia: decimal("valor_referencia", { precision: 10, scale: 2 }),
  dataMovimentacao: timestamp("data_movimentacao").defaultNow(),
});

export type XpMovimentacao = typeof xpMovimentacoes.$inferSelect;

/**
 * XP Configurações – chave/valor do sistema de fidelidade
 */
export const xpConfiguracoes = mysqlTable("xp_configuracoes", {
  id: int("id").autoincrement().primaryKey(),
  chave: varchar("chave", { length: 100 }).notNull().unique(),
  valor: varchar("valor", { length: 255 }).notNull(),
  descricao: varchar("descricao", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type XpConfiguracao = typeof xpConfiguracoes.$inferSelect;

// ─── Relations: clientes / XP ────────────────────────────────

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  xpConta: one(xpContas, { fields: [clientes.id], references: [xpContas.idCliente] }),
  xpMovimentacoes: many(xpMovimentacoes),
  xpCodigosUsados: many(xpCodigosUsados),
}));

export const xpContasRelations = relations(xpContas, ({ one }) => ({
  cliente: one(clientes, { fields: [xpContas.idCliente], references: [clientes.id] }),
}));

export const xpMovimentacoesRelations = relations(xpMovimentacoes, ({ one }) => ({
  cliente: one(clientes, { fields: [xpMovimentacoes.idCliente], references: [clientes.id] }),
  tipoMovimentacao: one(xpTiposMovimentacao, { fields: [xpMovimentacoes.idTipoMovimentacao], references: [xpTiposMovimentacao.id] }),
  codigo: one(xpCodigos, { fields: [xpMovimentacoes.idCodigo], references: [xpCodigos.id] }),
}));

export const xpCodigosRelations = relations(xpCodigos, ({ one }) => ({
  parceiro: one(xpParceiros, { fields: [xpCodigos.idParceiro], references: [xpParceiros.id] }),
}));

export const xpCodigosUsadosRelations = relations(xpCodigosUsados, ({ one }) => ({
  codigo: one(xpCodigos, { fields: [xpCodigosUsados.idCodigo], references: [xpCodigos.id] }),
  cliente: one(clientes, { fields: [xpCodigosUsados.idCliente], references: [clientes.id] }),
}));
