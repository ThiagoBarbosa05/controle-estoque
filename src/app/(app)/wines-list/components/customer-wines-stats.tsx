import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wine, TrendingUp, ListChecks } from "lucide-react";
import { getCustomerWinesStats } from "@/app/actions/customer-wines-list";

export async function CustomerWinesStats() {
  const result = await getCustomerWinesStats();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar estatísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  const {
    totalAssociations,
    uniqueCustomersWithWines,
    uniqueWinesInLists,
    averageWinesPerCustomer,
    topCustomersByWineCount,
    topWinesByCustomerCount,
  } = result.data ?? {
    totalAssociations: 0,
    uniqueCustomersWithWines: 0,
    uniqueWinesInLists: 0,
    averageWinesPerCustomer: 0,
    topCustomersByWineCount: [],
    topWinesByCustomerCount: [],
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Associações
          </CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAssociations}</div>
          <p className="text-xs text-muted-foreground">
            {uniqueCustomersWithWines} clientes com vinhos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vinhos Únicos</CardTitle>
          <Wine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {uniqueWinesInLists}
          </div>
          <p className="text-xs text-muted-foreground">
            Em {uniqueCustomersWithWines} listas diferentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Média por Cliente
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {averageWinesPerCustomer.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">Vinhos por cliente</p>
        </CardContent>
      </Card>

      {/* Top Customers Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCustomersByWineCount.slice(0, 3).map((customer, index) => (
              <div
                key={customer.customerId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium text-sm">
                    {customer.customerName}
                  </span>
                </div>
                <Badge variant="secondary">{customer.wineCount} vinhos</Badge>
              </div>
            ))}
            {topCustomersByWineCount.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Wines Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wine className="h-5 w-5" />
            Vinhos Mais Populares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topWinesByCustomerCount.slice(0, 3).map((wine, index) => (
              <div
                key={wine.wineId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium text-sm">{wine.wineName}</span>
                </div>
                <Badge variant="outline">{wine.customerCount} clientes</Badge>
              </div>
            ))}
            {topWinesByCustomerCount.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
