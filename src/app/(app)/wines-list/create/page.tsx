import { getCustomers } from "@/app/actions/customers";
import { getWines } from "@/app/actions/wines";
import { AddWinesToCustomerClient } from "./components/add-wines-to-customer-client";

export default async function AddWinesToCustomerPage() {
  // Carregamento inicial no servidor para melhor SSR e performance
  const [customersResult, winesResult] = await Promise.all([
    getCustomers({
      limit: 20,
      sortBy: "name",
      sortOrder: "asc",
    }),
    getWines({
      limit: 30,
      discontinued: "active",
      sortBy: "name",
      sortOrder: "asc",
    }),
  ]);

  const initialCustomers = customersResult.success
    ? customersResult.data?.customers || []
    : [];
  const initialWines = winesResult.success ? winesResult.data?.wines || [] : [];

  return (
    <AddWinesToCustomerClient
      initialCustomers={initialCustomers}
      initialWines={initialWines}
    />
  );
}
