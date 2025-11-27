// src/app/(protected)/history/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Filter (Sticky) */}
      <div className="sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur px-4 py-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-8 w-14 rounded-md flex-shrink-0" />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Calendar Skeleton (Large) */}
        <div className="rounded-2xl border bg-card p-4 space-y-4">
          <div className="flex justify-between items-center px-2 py-2">
            <Skeleton className="h-6 w-6" /> {/* Prev Arrow */}
            <Skeleton className="h-6 w-32" /> {/* Month Title */}
            <Skeleton className="h-6 w-6" /> {/* Next Arrow */}
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {[...Array(7)].map((_, i) => (
              <div key={`head-${i}`} className="flex justify-center">
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>

          {/* Calendar Grid (Big Height) */}
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <Skeleton
                key={`day-${i}`}
                className="aspect-square w-full rounded-md"
              />
            ))}
          </div>
        </div>

        {/* Selected Date Details */}
        <section className="space-y-6 pt-4">
          <div className="flex justify-between items-center px-1">
            <Skeleton className="h-8 w-48" /> {/* Date Title */}
            <Skeleton className="h-8 w-20 rounded-full" /> {/* Add Button */}
          </div>

          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </section>
      </div>
    </div>
  );
}
