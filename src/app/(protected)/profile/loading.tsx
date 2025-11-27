// src/app/(protected)/profile/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-32">
      {/* 1. User Header (Centered) */}
      <div className="pt-10 pb-6 flex flex-col items-center justify-center space-y-3 bg-gradient-to-b from-background to-muted/20">
        <div className="relative">
          <Skeleton className="w-24 h-24 rounded-full" /> {/* Avatar */}
        </div>

        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-8 w-40" /> {/* Name */}
          <Skeleton className="h-5 w-28 rounded-full" /> {/* Plan Badge */}
        </div>
      </div>

      <div className="px-4 space-y-6 -mt-2">
        {/* 2. Body Composition Card */}
        <div className="w-full bg-card border rounded-2xl p-5 shadow-sm h-[140px] relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-4 w-24" /> {/* Title */}
            <Skeleton className="h-4 w-4" /> {/* Icon */}
          </div>

          <div className="flex items-end justify-around px-2 mt-4">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-10 w-20" /> {/* Weight Value */}
              <Skeleton className="h-3 w-10" /> {/* Label */}
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-10 w-20" /> {/* Fat Value */}
              <Skeleton className="h-3 w-12" /> {/* Label */}
            </div>
          </div>
        </div>

        {/* 3. Settings List */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 ml-1" /> {/* Label "APP SETTINGS" */}
          <Card className="rounded-2xl overflow-hidden divide-y border shadow-sm">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </Card>
        </div>

        {/* 4. Logout Button */}
        <Skeleton className="w-full h-14 rounded-xl" />
      </div>
    </div>
  );
}
