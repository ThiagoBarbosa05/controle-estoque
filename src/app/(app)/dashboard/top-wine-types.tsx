import { getWineStats } from "@/app/actions/wines";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine } from "lucide-react";
import { unstable_cache } from "next/cache";

// Componente dos tipos de vinho mais populares
export async function TopWineTypes() {
  const result = await unstable_cache(
    async () => getWineStats(),
    ["wine-stats"]
  )();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar dados dos tipos
          </p>
        </CardContent>
      </Card>
    );
  }

  const { topTypes } = result.data ?? { topTypes: [] };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wine className="h-5 w-5" />
          Tipos Mais Populares
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topTypes.slice(0, 5).map((type, index) => (
            <div key={type.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                <span className="font-medium">{type.type}</span>
              </div>
              <Badge variant="outline">{type.count} vinhos</Badge>
            </div>
          ))}
          {topTypes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum dado disponível
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
