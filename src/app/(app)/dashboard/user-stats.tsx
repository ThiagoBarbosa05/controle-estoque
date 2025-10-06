import { getUserStats } from "@/app/actions/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Users } from "lucide-react";
import { unstable_cache } from "next/cache";

// Componente de estatísticas dos usuários
export async function UserStats() {
  const result = await unstable_cache(
    async () => await getUserStats(),
    ["user-stats"]
  )();

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
