import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wine,
  Package,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Globe,
  MoreHorizontal,
} from "lucide-react";
import {
  getWines,
  getWineStats,
  getLowStockWines,
  type GetWinesInput,
} from "@/app/actions/wines";
import { revalidateWinesCache } from "@/app/actions/wines-cache";
import { WineFilters } from "@/app/(app)/wines/wine-filters";
import { WinesPagination } from "@/components/wines/wines-pagination";
import {
  AddWineButton,
  EditWineButton,
  DeleteWineButton,
} from "@/components/wines/wine-dialogs";
import { QuickStockUpdate } from "@/components/wines/quick-stock-update";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatCardSkeleton } from "./stat-card-skeleton";
import { WinesStats } from "./wine-stats";
import { WinesTableSkeleton } from "./wines-table-skeleton";
import { WinesList } from "./wines-list";

// Componente de carregamento



// Componente de estatísticas gerais dos vinhos


// Componente de alerta de baixo estoque
// async function LowStockAlert() {
//   const result = await getLowStockWines(5);

//   if (!result.success || !result.data || result.data.length === 0) {
//     return null;
//   }

//   const lowStockWines = result.data;

//   return (
//     <Card className="border-amber-200 bg-amber-50">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2 text-amber-600">
//           <AlertTriangle className="h-5 w-5" />
//           Vinhos com Estoque Baixo
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="grid gap-2">
//           {lowStockWines.slice(0, 5).map((wine) => (
//             <div
//               key={wine.id}
//               className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200"
//             >
//               <div>
//                 <p className="font-medium">{wine.name}</p>
//                 <p className="text-sm text-muted-foreground">
//                   {wine.country} • {wine.type} • {wine.size}
//                 </p>
//               </div>
//               <Badge
//                 variant="outline"
//                 className="text-amber-600 border-amber-600"
//               >
//                 {wine.inStock} unidades
//               </Badge>
//             </div>
//           ))}
//           {lowStockWines.length > 5 && (
//             <p className="text-sm text-muted-foreground mt-2 text-center">
//               +{lowStockWines.length - 5} outros vinhos com estoque baixo
//             </p>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// Componente da lista de vinhos


// Componente principal da página
export default async function WinesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Normalizar searchParams
  const normalizedSearchParams = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vinhos</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de vinhos e controle de estoque
          </p>
        </div>
        <form action={revalidateWinesCache}>
          <Button type="submit" variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Cache
          </Button>
        </form>
      </div>

      {/* Grid de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<StatCardSkeleton />}>
          <WinesStats />
        </Suspense>
      </div>

      {/* Alerta de estoque baixo */}
      {/* <Suspense
        fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}
      >
        <LowStockAlert />
      </Suspense> */}

      {/* Lista de vinhos com filtros */}
      <Suspense fallback={<WinesTableSkeleton />}>
        <WinesList searchParams={normalizedSearchParams} />
      </Suspense>
    </div>
  );
}
