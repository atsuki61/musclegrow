"use client";
import { Card } from "@/components/ui/card";

export function HistoryCalendarSkeleton() {
  return (
    <Card className="w-full p-4 animate-pulse space-y-4 rounded-2xl border border-border/60">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center px-2">
        <div className="h-9 w-9 bg-muted rounded-full" />
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-9 w-9 bg-muted rounded-full" />
      </div>

      {/* カレンダーグリッド */}
      <div className="space-y-2">
        {/* 曜日 */}
        <div className="flex justify-between mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`head-${i}`} className="h-8 w-10 bg-muted/50 rounded" />
          ))}
        </div>
        {/* 日付セル (5行分) */}
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={`row-${row}`} className="flex justify-between gap-1">
            {Array.from({ length: 7 }).map((_, col) => (
              <div
                key={`cell-${row}-${col}`}
                className="flex-1 aspect-square bg-muted/30 rounded-lg"
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
