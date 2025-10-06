import { getCustomerStats } from "@/app/actions/customers";
import { getUserStats } from "@/app/actions/users";
import { getWineStats } from "@/app/actions/wines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { unstable_cache } from "next/cache";

// Componente de visão geral do sistema
export async function SystemOverview() {
  const customerResult = await unstable_cache(
    async () => await getCustomerStats(),
    ["customer-stats"]
  )();

  const wineResult = await unstable_cache(
    async () => await getWineStats(),
    ["wine-stats"]
  )();

  const userResult = await unstable_cache(
    async () => await getUserStats(),
    ["user-stats"]
  )();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Visão Geral do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {customerResult.success ? customerResult.data?.total || 0 : 0}
              </div>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {wineResult.success ? wineResult.data?.total || 0 : 0}
              </div>
              <p className="text-xs text-muted-foreground">Vinhos</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {userResult.success ? userResult.data?.totalUsers || 0 : 0}
              </div>
              <p className="text-xs text-muted-foreground">Usuários</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {wineResult.success ? wineResult.data?.active || 0 : 0}
              </div>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Última atualização:</span>
              <span className="font-medium">
                {new Date().toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
