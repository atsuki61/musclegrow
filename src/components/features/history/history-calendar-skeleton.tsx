"use client";
import { Card } from "@/components/ui/card";

export function HistoryCalendarSkeleton() {
  return (
    <Card className="w-full p-4 animate-pulse space-y-4">
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-muted" />
        ))}
      </div>
    </Card>
  );
}
