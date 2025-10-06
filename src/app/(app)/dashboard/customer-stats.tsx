import { getCustomerStats } from "@/app/actions/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { unstable_cache } from "next/cache";

// Componente de estatísticas dos clientes
export async function CustomerStats() {
  const result = await unstable_cache(
    async () => await getCustomerStats(),
    ["customer-stats"]
  )();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar estatísticas de clientes
          </p>
        </CardContent>
      </Card>
    );
  }

  const { total, recentCount } = result.data ?? { total: 0, recentCount: 0 };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{total}</div>
        <p className="text-xs text-muted-foreground">
          +{recentCount} nos últimos 30 dias
        </p>
      </CardContent>
    </Card>
  );
}
