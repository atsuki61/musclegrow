// src/app/(protected)/record/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* Header Skeleton (Sticky) */}
      <div className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b pb-1">
        {/* Date Selector */}
        <div className="flex h-14 items-center justify-center px-4">
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>

        {/* Body Part Tabs */}
        <div className="px-2 pt-1 flex gap-2 overflow-x-auto no-scrollbar">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Search Bar */}
        <Skeleton className="h-11 w-full rounded-xl" />

        {/* Exercise Cards Grid (3 columns) */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl border bg-card p-3 flex flex-col justify-between"
            >
              <div className="flex justify-end">
                <Skeleton className="h-5 w-10 rounded-md" />{" "}
                {/* Weight Badge */}
              </div>

              <div className="flex justify-center items-center flex-1">
                {/* Exercise Name Placeholder */}
                <div className="space-y-1 w-full flex flex-col items-center">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>

              <div className="flex justify-center">
                <Skeleton className="h-5 w-10 rounded-full" /> {/* Tag Badge */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
