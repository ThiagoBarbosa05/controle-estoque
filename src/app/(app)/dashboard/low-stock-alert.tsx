import { getLowStockWines } from "@/app/actions/wines";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { unstable_cache } from "next/cache";

// Componente de vinhos com baixo estoque
export async function LowStockAlert() {
  const result = await unstable_cache(
    async () => await getLowStockWines(),
    ["low-stock-wines"]
  )();

  if (!result.success) {
    return null;
  }

  const lowStockWines = result.data ?? [];

  if (lowStockWines.length === 0) {
    return null;
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          Vinhos com Estoque Baixo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {lowStockWines.slice(0, 5).map((wine) => (
            <div
              key={wine.id}
              className="flex items-center justify-between p-2 bg-amber-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{wine.name}</p>
                <p className="text-sm text-muted-foreground">
                  {wine.country} • {wine.type}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-600"
              >
                {wine.inStock} unidades
              </Badge>
            </div>
          ))}
          {lowStockWines.length > 5 && (
            <p className="text-sm text-muted-foreground mt-2">
              +{lowStockWines.length - 5} outros vinhos com estoque baixo
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
