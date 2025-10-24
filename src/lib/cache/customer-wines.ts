/**
 * Cache configuration and revalidation utilities for customer wines
 * Following Next.js App Router best practices
 */

// Cache tags for targeted revalidation
export const CACHE_TAGS = {
  CUSTOMER_WINES: "customer-wines",
  CUSTOMER_WINES_LIST: (customerId: string) => `customer-wines-${customerId}`,
  WINE_CUSTOMERS: (wineId: string) => `wine-customers-${wineId}`,
  CUSTOMER_WINES_STATS: "customer-wines-stats",
  AVAILABLE_WINES: (customerId: string) => `available-wines-${customerId}`,
} as const;

// Revalidation paths for different operations
export const REVALIDATION_PATHS = {
  CUSTOMERS: "/customers",
  WINES: "/wines",
  CUSTOMER_DETAIL: (customerId: string) => `/customers/${customerId}`,
  WINE_DETAIL: (wineId: string) => `/wines/${wineId}`,
  CUSTOMER_WINES: (customerId: string) => `/customers/${customerId}/wines`,
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  STATS: 300, // 5 minutes
  CUSTOMER_WINES: 60, // 1 minute
  AVAILABLE_WINES: 300, // 5 minutes
} as const;

// Fetch options for different types of data
export const FETCH_OPTIONS = {
  STATIC: { cache: "force-cache" as const },
  NO_CACHE: { cache: "no-store" as const },
  REVALIDATE_SHORT: { next: { revalidate: CACHE_DURATIONS.CUSTOMER_WINES } },
  REVALIDATE_MEDIUM: { next: { revalidate: CACHE_DURATIONS.AVAILABLE_WINES } },
  REVALIDATE_LONG: { next: { revalidate: CACHE_DURATIONS.STATS } },
} as const;
