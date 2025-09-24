import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Wine,
  UserCheck,
  Package,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Globe,
} from "lucide-react";
import { getCustomerStats } from "@/app/actions/customers";
import { getWineStats, getLowStockWines } from "@/app/actions/wines";
import { getUserStats } from "@/app/actions/users";
import { getCustomerWinesStats } from "@/app/actions/customer-wines-list";
import { revalidateDashboard } from "@/app/actions/dashboard";

// Componente de carregamento
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

// Componente de estatísticas dos clientes
async function CustomerStats() {
  const result = await getCustomerStats();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar estatísticas de clientes
          </p>
        </CardContent>
      </Card>
    );
  }

  const { total, recentCount } = result.data ?? { total: 0, recentCount: 0 };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{total}</div>
        <p className="text-xs text-muted-foreground">
          +{recentCount} nos últimos 30 dias
        </p>
      </CardContent>
    </Card>
  );
}

// Componente de estatísticas dos vinhos
async function WineStats() {
  const result = await getWineStats();

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

// Componente de estatísticas dos usuários
async function UserStats() {
  const result = await getUserStats();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar estatísticas de usuários
          </p>
        </CardContent>
      </Card>
    );
  }

  const { totalUsers, verifiedUsers, verificationRate, usersCreatedThisMonth } =
    result.data ?? {
      totalUsers: 0,
      verifiedUsers: 0,
      verificationRate: 0,
      usersCreatedThisMonth: 0,
    };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Usuários
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            +{usersCreatedThisMonth} este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Usuários Verificados
          </CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{verifiedUsers}</div>
          <p className="text-xs text-muted-foreground">
            {verificationRate.toFixed(1)}% taxa de verificação
          </p>
        </CardContent>
      </Card>
    </>
  );
}

// Componente de estatísticas das listas de vinhos dos clientes
async function CustomerWinesStats() {
  const result = await getCustomerWinesStats();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar estatísticas das listas
          </p>
        </CardContent>
      </Card>
    );
  }

  const {
    totalAssociations,
    uniqueCustomersWithWines,
    averageWinesPerCustomer,
  } = result.data ?? {
    totalAssociations: 0,
    uniqueCustomersWithWines: 0,
    averageWinesPerCustomer: 0,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Associações Ativas
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalAssociations}</div>
        <p className="text-xs text-muted-foreground">
          {uniqueCustomersWithWines} clientes •{" "}
          {averageWinesPerCustomer.toFixed(1)} vinhos/cliente
        </p>
      </CardContent>
    </Card>
  );
}

// Componente dos países com mais vinhos
async function TopCountries() {
  const result = await getWineStats();

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

// Componente dos tipos de vinho mais populares
async function TopWineTypes() {
  const result = await getWineStats();

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

// Componente de visão geral do sistema
async function SystemOverview() {
  const [customerResult, wineResult, userResult] = await Promise.all([
    getCustomerStats(),
    getWineStats(),
    getUserStats(),
  ]);

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

// Componente de vinhos com baixo estoque
async function LowStockAlert() {
  const result = await getLowStockWines(5);

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

// Componente principal do dashboard
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de controle de estoque
          </p>
        </div>
        <form action={revalidateDashboard}>
          <Button type="submit" variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </form>
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
