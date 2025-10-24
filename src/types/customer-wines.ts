import type { customerWinesList } from "@/db/schema";

// Base types from database schema
export type CustomerWinesList = typeof customerWinesList.$inferSelect;

// Extended types for data with joins
export type CustomerWineWithDetails = CustomerWinesList & {
  customer: {
    id: string;
    name: string;
  };
  wine: {
    id: string;
    name: string;
    country: string | null;
    type: string | null;
    size: string | null;
    inStock: number;
    discontinued: boolean;
  };
};

// Pagination types
export type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedCustomerWines = {
  customerWines: CustomerWineWithDetails[];
  pagination: PaginationData;
};

// Action result types
export type CustomerWinesActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

// Statistics types
export type CustomerWinesStats = {
  totalAssociations: number;
  uniqueCustomersWithWines: number;
  uniqueWinesInLists: number;
  topCustomersByWineCount: {
    customerId: string;
    customerName: string;
    wineCount: number;
  }[];
  topWinesByCustomerCount: {
    wineId: string;
    wineName: string;
    customerCount: number;
  }[];
  averageWinesPerCustomer: number;
};

// Filter types
export type CustomerWinesFilters = {
  search?: string;
  wineType?: string;
  country?: string;
  discontinued?: "all" | "active" | "discontinued";
};

export type CustomerWinesSortBy =
  | "wineName"
  | "wineCountry"
  | "wineType"
  | "addedAt";
export type WineCustomersSortBy = "customerName" | "addedAt";
export type SortOrder = "asc" | "desc";

// Pagination params
export type PaginationParams = {
  page: number;
  limit: number;
};

// Full query params for getting customer wines
export type GetCustomerWinesParams = PaginationParams & {
  customerId: string;
  sortBy: CustomerWinesSortBy;
  sortOrder: SortOrder;
} & CustomerWinesFilters;

// Full query params for getting wine customers
export type GetWineCustomersParams = PaginationParams & {
  wineId: string;
  sortBy: WineCustomersSortBy;
  sortOrder: SortOrder;
  search?: string;
};
