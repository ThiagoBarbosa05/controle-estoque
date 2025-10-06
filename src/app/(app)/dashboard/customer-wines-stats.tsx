import { getCustomerWinesStats } from "@/app/actions/customer-wines-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { unstable_cache } from "next/cache";

// Componente de estatísticas das listas de vinhos dos clientes
export async function CustomerWinesStats() {
  const result = await unstable_cache(
    async () => await getCustomerWinesStats(),
    ["customer-wines-stats"]
  )();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar estatísticas das listas
          </p>
        </CardContent>
      </Card>
    );
  }

  const {
    totalAssociations,
    uniqueCustomersWithWines,
    averageWinesPerCustomer,
  } = result.data ?? {
    totalAssociations: 0,
    uniqueCustomersWithWines: 0,
    averageWinesPerCustomer: 0,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Associações Ativas
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalAssociations}</div>
        <p className="text-xs text-muted-foreground">
          {uniqueCustomersWithWines} clientes •{" "}
          {averageWinesPerCustomer.toFixed(1)} vinhos/cliente
        </p>
      </CardContent>
    </Card>
  );
}
