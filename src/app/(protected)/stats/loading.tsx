// src/app/(protected)/stats/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-4 space-y-4 pb-20">
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
        <Skeleton className="h-8 rounded-md bg-background shadow-sm" />
        <div className="h-8 rounded-md" /> {/* Inactive tab */}
      </div>

      {/* Date Range Selector */}
      <div className="flex justify-between items-center bg-muted/30 p-1 rounded-lg">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-md" />
        ))}
      </div>

      {/* Horizontal Nav (Chart Types) */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Main Chart Area */}
      <div className="space-y-2">
        <div className="h-[300px] w-full rounded-xl border bg-card p-4 flex items-end gap-2">
          {/* Fake Chart Bars */}
          {[...Array(7)].map((_, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-t-sm"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
        {/* X-Axis Labels */}
        <div className="flex justify-between px-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}
