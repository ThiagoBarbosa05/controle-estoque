import { z } from "zod";

// Base schemas for validation
export const addWineToCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineId: z.string().uuid("ID do vinho inválido"),
});

export const removeWineFromCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineId: z.string().uuid("ID do vinho inválido"),
});

export const bulkAddWinesToCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineIds: z
    .array(z.string().uuid("ID do vinho inválido"))
    .min(1, "Pelo menos um vinho deve ser selecionado")
    .max(50, "Máximo 50 vinhos por operação"),
});

export const bulkRemoveWinesFromCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineIds: z
    .array(z.string().uuid("ID do vinho inválido"))
    .min(1, "Pelo menos um vinho deve ser selecionado"),
});

export const transferWinesSchema = z.object({
  fromCustomerId: z.string().uuid("ID do cliente origem inválido"),
  toCustomerId: z.string().uuid("ID do cliente destino inválido"),
  wineIds: z
    .array(z.string().uuid("ID do vinho inválido"))
    .min(1, "Pelo menos um vinho deve ser selecionado"),
});

// Pagination and search schemas
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const customerWinesFiltersSchema = z.object({
  search: z.string().optional(),
  wineType: z.string().optional(),
  country: z.string().optional(),
  discontinued: z.enum(["all", "active", "discontinued"]).default("active"),
});

export const customerWinesSortSchema = z.object({
  sortBy: z
    .enum(["wineName", "wineCountry", "wineType", "addedAt"])
    .default("addedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const wineCustomersSortSchema = z.object({
  sortBy: z.enum(["customerName", "addedAt"]).default("addedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Complex schemas combining multiple parts
export const getCustomerWinesSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  ...paginationSchema.shape,
  ...customerWinesSortSchema.shape,
  ...customerWinesFiltersSchema.shape,
});

export const getWineCustomersSchema = z.object({
  wineId: z.string().uuid("ID do vinho inválido"),
  ...paginationSchema.shape,
  ...wineCustomersSortSchema.shape,
  search: z.string().optional(),
});

// Input type inference from schemas
export type AddWineToCustomerInput = z.infer<typeof addWineToCustomerSchema>;
export type RemoveWineFromCustomerInput = z.infer<
  typeof removeWineFromCustomerSchema
>;
export type BulkAddWinesToCustomerInput = z.infer<
  typeof bulkAddWinesToCustomerSchema
>;
export type BulkRemoveWinesFromCustomerInput = z.infer<
  typeof bulkRemoveWinesFromCustomerSchema
>;
export type TransferWinesInput = z.infer<typeof transferWinesSchema>;
export type GetCustomerWinesInput = z.infer<typeof getCustomerWinesSchema>;
export type GetWineCustomersInput = z.infer<typeof getWineCustomersSchema>;
