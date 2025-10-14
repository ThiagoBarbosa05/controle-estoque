import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const customers = pgTable("customers", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const wines = pgTable("wines", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  country: text("country"),
  type: text("type"),
  inStock: integer("in_stock").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  size: text("size"),
  discontinued: boolean("discontinued").default(false).notNull(),
  externalId: text("external_id").notNull().unique(),
  minStock: integer("min_stock").default(0).notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const customerWinesList = pgTable("customer_wines_list", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  wineId: text("wine_id")
    .notNull()
    .references(() => wines.id),
});

export const erpTokens = pgTable("erp_tokens", {
  id: text("id").primaryKey(),
  erpName: text("erp_name").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresIn: timestamp("expires_in").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Tabela para armazenar notas fiscais
export const invoices = pgTable(
  "invoices",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    blingId: text("bling_id").notNull().unique(), // ID da nota fiscal no Bling
    tipo: integer("tipo").notNull(), // Tipo da nota fiscal (1 = Entrada, 2 = Saída)
    situacao: integer("situacao").notNull(), // Situação da nota fiscal
    numero: text("numero").notNull(), // Número da nota fiscal
    dataEmissao: timestamp("data_emissao").notNull(), // Data de emissão
    dataOperacao: timestamp("data_operacao").notNull(), // Data da operação
    contatoId: text("contato_id"), // ID do contato no Bling
    naturezaOperacaoId: text("natureza_operacao_id"), // ID da natureza da operação no Bling
    lojaId: text("loja_id"), // ID da loja no Bling
    valorTotal: decimal("valor_total", { precision: 15, scale: 2 }), // Valor total da nota fiscal
    rawData: jsonb("raw_data").notNull(), // Dados brutos do webhook para auditoria
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    blingIdIdx: index("invoices_bling_id_idx").on(table.blingId),
    dataEmissaoIdx: index("invoices_data_emissao_idx").on(table.dataEmissao),
    situacaoIdx: index("invoices_situacao_idx").on(table.situacao),
  })
);

// Tabela para logs de webhooks
export const webhookLogs = pgTable(
  "webhook_logs",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    eventId: text("event_id").notNull(), // ID único do evento do webhook
    eventType: text("event_type").notNull(), // Tipo do evento (ex: "invoice.created", "invoice.updated")
    resourceId: text("resource_id"), // ID do recurso afetado (ex: ID da nota fiscal)
    status: text("status").notNull(), // "success" ou "error"
    statusCode: integer("status_code"), // Código HTTP de resposta
    errorMessage: text("error_message"), // Mensagem de erro (se houver)
    errorStack: text("error_stack"), // Stack trace do erro (se houver)
    processedAt: timestamp("processed_at").defaultNow().notNull(),
    processingTime: integer("processing_time"), // Tempo de processamento em ms
    requestHeaders: jsonb("request_headers"), // Headers da requisição
    requestBody: jsonb("request_body").notNull(), // Body da requisição do webhook
    responseBody: jsonb("response_body"), // Resposta enviada de volta
    ipAddress: text("ip_address"), // IP de origem da requisição
    userAgent: text("user_agent"), // User agent da requisição
    signature: text("signature"), // Assinatura HMAC para validação
    signatureValid: boolean("signature_valid"), // Se a assinatura foi validada com sucesso
    retryAttempt: integer("retry_attempt").default(0), // Número da tentativa (0 = primeira tentativa)
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    eventIdIdx: index("webhook_logs_event_id_idx").on(table.eventId),
    eventTypeIdx: index("webhook_logs_event_type_idx").on(table.eventType),
    statusIdx: index("webhook_logs_status_idx").on(table.status),
    processedAtIdx: index("webhook_logs_processed_at_idx").on(
      table.processedAt
    ),
  })
);
