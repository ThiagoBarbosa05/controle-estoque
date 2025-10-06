import { getWineStats } from "@/app/actions/wines";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { unstable_cache } from "next/cache";

// Componente dos países com mais vinhos
export async function TopCountries() {
  const result = await unstable_cache(
    async () => await getWineStats(),
    ["wine-stats"]
  )();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar dados dos países
          </p>
        </CardContent>
      </Card>
    );
  }

  const { topCountries } = result.data ?? { topCountries: [] };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Países com Mais Vinhos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topCountries.slice(0, 5).map((country, index) => (
            <div
              key={country.country}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                <span className="font-medium">{country.country}</span>
              </div>
              <Badge variant="secondary">{country.count} vinhos</Badge>
            </div>
          ))}
          {topCountries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum dado disponível
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
