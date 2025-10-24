import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wine, TrendingUp, BarChart3 } from "lucide-react";
import { getCustomerWinesStats } from "@/lib/data/customer-wines";

export async function CustomerWinesStats() {
  const stats = await getCustomerWinesStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Associations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Associações
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAssociations}</div>
          <p className="text-xs text-muted-foreground">
            Vinhos adicionados a listas de clientes
          </p>
        </CardContent>
      </Card>

      {/* Unique Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Clientes com Vinhos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.uniqueCustomersWithWines}
          </div>
          <p className="text-xs text-muted-foreground">
            Clientes que possuem vinhos em suas listas
          </p>
        </CardContent>
      </Card>

      {/* Unique Wines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vinhos em Listas
          </CardTitle>
          <Wine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueWinesInLists}</div>
          <p className="text-xs text-muted-foreground">
            Vinhos únicos presentes em listas
          </p>
        </CardContent>
      </Card>

      {/* Average */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Média por Cliente
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageWinesPerCustomer}
          </div>
          <p className="text-xs text-muted-foreground">
            Vinhos por cliente em média
          </p>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Top Clientes por Quantidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topCustomersByWineCount.map((customer, index) => (
              <div
                key={customer.customerId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="w-6 h-6 p-0 flex items-center justify-center"
                  >
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{customer.customerName}</span>
                </div>
                <Badge variant="secondary">{customer.wineCount} vinhos</Badge>
              </div>
            ))}
            {stats.topCustomersByWineCount.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente com vinhos encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Wines */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Top Vinhos por Popularidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topWinesByCustomerCount.map((wine, index) => (
              <div
                key={wine.wineId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="w-6 h-6 p-0 flex items-center justify-center"
                  >
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{wine.wineName}</span>
                </div>
                <Badge variant="secondary">{wine.customerCount} clientes</Badge>
              </div>
            ))}
            {stats.topWinesByCustomerCount.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum vinho em listas encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
