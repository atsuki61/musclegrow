import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header / User Info */}
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 text-center">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Settings List */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
