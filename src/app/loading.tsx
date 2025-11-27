// src/app/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pt-4 pb-4 space-y-6">
      {/* 1. Header Info (BIG 3 TOTAL & Weight) - カードの外へ */}
      <div className="flex justify-between items-start px-1">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" /> {/* Title */}
          <Skeleton className="h-4 w-24" /> {/* Subtitle */}
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <Skeleton className="h-8 w-24" /> {/* Total Weight */}
          <Skeleton className="h-5 w-20 rounded-full" /> {/* Badge */}
        </div>
      </div>

      {/* 2. Progress Card */}
      <div className="rounded-3xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between items-end">
              <Skeleton className="h-4 w-20" /> {/* Exercise Name */}
              <Skeleton className="h-4 w-16" /> {/* Weight Status */}
            </div>
            <Skeleton className="h-3 w-full rounded-full" />{" "}
            {/* Progress Bar */}
          </div>
        ))}

        <div className="flex justify-center pt-2">
          <Skeleton className="h-4 w-24" /> {/* Link */}
        </div>
      </div>

      {/* 3. Record Button */}
      <div className="pt-2">
        <Skeleton className="h-14 w-full rounded-2xl shadow-md" />
      </div>
    </div>
  );
}
