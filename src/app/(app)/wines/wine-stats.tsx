import { getWineStats } from "@/app/actions/wines";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Wine } from "lucide-react";
import { unstable_cache } from "next/cache";

export async function WinesStats() {
  const result = await unstable_cache(async () => await getWineStats(), [
    "wine-stats",
  ])();

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

  const { total, active, discontinued, outOfStock, lowStock, recentCount } =
    result.data ?? {
      total: 0,
      active: 0,
      discontinued: 0,
      outOfStock: 0,
      lowStock: 0,
      recentCount: 0,
    };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Vinhos</CardTitle>
          <Wine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            {active} ativos, {discontinued} descontinuados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
          <p className="text-xs text-muted-foreground">Sem estoque</p>
          {lowStock > 0 && (
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-600 mt-2"
            >
              {lowStock} com estoque baixo
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Adicionados Recentemente
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{recentCount}</div>
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
        </CardContent>
      </Card>
    </>
  );
}