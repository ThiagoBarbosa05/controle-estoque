import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WinesTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Cabeçalho da tabela - desktop */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 pb-2 border-b">
            <Skeleton className="h-4 w-16 col-span-3" />
            <Skeleton className="h-4 w-12 col-span-2" />
            <Skeleton className="h-4 w-10 col-span-2" />
            <Skeleton className="h-4 w-16 col-span-1" />
            <Skeleton className="h-4 w-14 col-span-1" />
            <Skeleton className="h-4 w-12 col-span-1" />
            <Skeleton className="h-4 w-12 col-span-2" />
          </div>

          {/* Linhas da tabela */}
          {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((id) => (
            <div key={id} className="animate-pulse">
              {/* Layout mobile */}
              <div className="md:hidden space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>

              {/* Layout desktop */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 border rounded-lg">
                <Skeleton className="h-5 w-full col-span-3" />
                <Skeleton className="h-5 w-20 col-span-2" />
                <Skeleton className="h-5 w-16 col-span-2" />
                <Skeleton className="h-5 w-12 col-span-1" />
                <Skeleton className="h-6 w-8 col-span-1" />
                <Skeleton className="h-6 w-16 col-span-1" />
                <div className="col-span-2 flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}

          {/* Paginação skeleton */}
          <div className="flex items-center justify-between pt-4">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
