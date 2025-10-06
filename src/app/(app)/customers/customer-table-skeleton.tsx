export function CustomersTableSkeleton() {
  const skeletonItems = Array.from({ length: 5 }, (_, index) => ({
    id: `skeleton-${index}-${Math.random().toString(36).substr(2, 9)}`,
    index,
  }));

  return (
    <div className="space-y-3">
      {skeletonItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
            <div className="space-y-1">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
