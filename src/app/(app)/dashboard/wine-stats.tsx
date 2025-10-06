import { getWineStats } from "@/app/actions/wines";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wine } from "lucide-react";
import { unstable_cache } from "next/cache";

// Componente de estatísticas dos vinhos
export async function WineStats() {
  const result = await unstable_cache(
    async () => getWineStats(),
    ["wine-stats"]
  )();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar estatísticas de vinhos
          </p>
        </CardContent>
      </Card>
    );
  }

  const { total, active, discontinued, outOfStock, lowStock } = result.data ?? {
    total: 0,
    active: 0,
    discontinued: 0,
    outOfStock: 0,
    lowStock: 0,
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
            <div className="mt-2">
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600"
              >
                {lowStock} com estoque baixo
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
