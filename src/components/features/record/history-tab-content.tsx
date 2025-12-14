"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, Clock } from "lucide-react";
import { useExerciseHistory } from "./hooks/use-exercise-history";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoryTabContentProps {
  exerciseId: string;
}

export function HistoryTabContent({ exerciseId }: HistoryTabContentProps) {
  const { history, isLoading } = useExerciseHistory(exerciseId);

  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 border rounded-xl space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
          <CalendarDays className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          まだ記録がありません
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          トレーニングを行うとここに履歴が表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {history.map((record, index) => (
        <div
          key={index}
          className="bg-card border border-border/50 rounded-xl p-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* 日付ヘッダー */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/40">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-center min-w-12">
              {format(record.date, "M/d")}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {format(record.date, "yyyy年 (E)", { locale: ja })}
            </span>
          </div>

          {/* セットリスト */}
          <div className="space-y-1">
            {record.sets.map((set, setIndex) => (
              <div
                key={setIndex}
                className="flex items-center justify-between text-sm py-1 px-1 hover:bg-muted/30 rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground/40 font-mono w-4 text-center">
                    {set.setOrder}
                  </span>

                  {/* 重量 x 回数 または 時間 */}
                  {set.duration ? (
                    // 時間計測の場合
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-bold tabular-nums">
                        {set.duration}
                      </span>
                      <span className="text-xs text-muted-foreground">秒</span>
                    </div>
                  ) : (
                    // 通常の筋トレの場合
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold tabular-nums text-base">
                        {set.weight ?? "-"}
                      </span>
                      <span className="text-xs text-muted-foreground mr-1">
                        kg
                      </span>
                      <span className="text-xs text-muted-foreground/40 mx-1">
                        ✕
                      </span>
                      <span className="font-bold tabular-nums text-base">
                        {set.reps}
                      </span>
                      <span className="text-xs text-muted-foreground">回</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
