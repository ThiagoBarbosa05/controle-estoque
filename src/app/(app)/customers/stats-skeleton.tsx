import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Componente de loading para estatísticas
export function StatsSkeleton() {
  const skeletonCards = [
    { id: "stats-skeleton-total", type: "total" },
    { id: "stats-skeleton-recent", type: "recent" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {skeletonCards.map((card) => (
        <Card key={card.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
