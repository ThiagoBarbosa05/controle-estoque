import { Card, CardContent } from "@/components/ui/card";

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-8 bg-muted rounded w-16"></div>
          <div className="h-3 bg-muted rounded w-32"></div>
        </div>
      </CardContent>
    </Card>
  );
}
