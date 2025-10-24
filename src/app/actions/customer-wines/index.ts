// Re-export all customer wines server actions
export {
  addWineToCustomer,
  removeWineFromCustomer,
  clearCustomerWinesList,
} from "./basic-operations";

export {
  bulkAddWinesToCustomer,
  bulkRemoveWinesFromCustomer,
  transferWinesBetweenCustomers,
} from "./bulk-operations";

export { getCustomerWinesStatsAction } from "./stats";

// Re-export data fetching functions (not server actions but useful for RSCs)
export {
  getCustomerWines,
  getWineCustomers,
  getCustomerWinesStats,
  isWineInCustomerList,
  getAvailableWinesForCustomer,
} from "@/lib/data/customer-wines";
