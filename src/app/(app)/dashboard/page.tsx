import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { StatCardSkeleton } from "./stat-card-skeleton";
import { CustomerStats } from "./customer-stats";
import { WineStats } from "./wine-stats";
import { UserStats } from "./user-stats";
import { CustomerWinesStats } from "./customer-wines-stats";
import { LowStockAlert } from "./low-stock-alert";
import { TopCountries } from "./top-countries";
import { TopWineTypes } from "./top-wine-types";
import { SystemOverview } from "./system-overview";
import { revalidatePath } from "next/cache";

// Componente principal do dashboard
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-x-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de controle de estoque
          </p>
        </div>

        <Button
          // onClick={() => revalidatePath("/dashboard")}
          title="Atualizar"
          type="submit"
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Status do sistema */}
      <Card className="bg-green-50 border-green-200">
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">
              Sistema Operacional
            </span>
            <span className="text-xs text-green-600 ml-auto">
              Todos os serviços funcionando normalmente
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Grid de estatísticas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <CustomerStats />
        </Suspense>

        <Suspense fallback={<StatCardSkeleton />}>
          <WineStats />
        </Suspense>

        <Suspense fallback={<StatCardSkeleton />}>
          <UserStats />
        </Suspense>

        <Suspense fallback={<StatCardSkeleton />}>
          <CustomerWinesStats />
        </Suspense>
      </div>

      {/* Alertas e informações importantes */}
      <Suspense
        fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}
      >
        <LowStockAlert />
      </Suspense>

      {/* Informações detalhadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Suspense
          fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}
        >
          <TopCountries />
        </Suspense>

        <Suspense
          fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}
        >
          <TopWineTypes />
        </Suspense>

        <Suspense
          fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}
        >
          <SystemOverview />
        </Suspense>
      </div>
    </div>
  );
}
