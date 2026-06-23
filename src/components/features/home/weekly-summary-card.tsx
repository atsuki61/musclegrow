"use client";

import { useCallback, useEffect, useState } from "react";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";
import { useAuthSession } from "@/lib/auth-session-context";
import { shouldUseDbOnly } from "@/lib/data-source";
import { getWeeklySummaryFromStorage } from "@/lib/local-storage-weekly-summary";
import {
  getWeekRange,
  getJstWeekdayIndex,
  calcVolumeDelta,
  mergeWeeklySummary,
  type WeeklySummary,
} from "@/lib/utils/weekly-summary";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

interface WeeklySummaryCardProps {
  initial: WeeklySummary;
}

export function WeeklySummaryCard({ initial }: WeeklySummaryCardProps) {
  const { userId } = useAuthSession();
  const [summary, setSummary] = useState<WeeklySummary>(initial);
  const todayIndex = getJstWeekdayIndex();

  const recompute = useCallback(() => {
    // ログイン+移行完了ならDB初期値をそのまま使う
    if (shouldUseDbOnly(userId)) {
      setSummary(initial);
      return;
    }
    // ゲスト or 移行未完了: localStorage集計をマージ
    const task = () => {
      const local = getWeeklySummaryFromStorage(getWeekRange());
      setSummary(mergeWeeklySummary(initial, local));
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(task);
    } else {
      setTimeout(task, 1);
    }
  }, [userId, initial]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    const handler = () => recompute();
    window.addEventListener("workout-record-updated", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("workout-record-updated", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [recompute]);

  const delta = calcVolumeDelta(summary.totalVolume, summary.prevWeekVolume);
  const hasData = summary.gymCount > 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-bold text-xs tracking-wider text-muted-foreground flex items-center gap-1.5 uppercase">
          <Flame className="w-4 h-4 text-primary fill-primary" />
          This Week
        </h2>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />

        {/* 曜日ドット */}
        <div className="flex justify-between mb-4">
          {WEEKDAY_LABELS.map((label, i) => {
            const done = summary.trainedDays[i];
            const isToday = i === todayIndex;
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <span
                  className={`text-[10px] font-bold ${
                    isToday ? "text-primary" : "text-muted-foreground/60"
                  }`}
                >
                  {label}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    done
                      ? "bg-linear-to-br from-primary to-orange-600 text-white shadow-lg shadow-primary/25 scale-105"
                      : "bg-muted/50 text-muted-foreground/20"
                  } ${
                    isToday && !done
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : ""
                  }`}
                >
                  {done ? "✓" : ""}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3指標 */}
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div>
            <div className="text-lg font-black tabular-nums leading-none">
              {summary.totalVolume.toLocaleString()}
              <span className="text-[11px] font-bold text-muted-foreground">
                {" "}
                kg
              </span>
            </div>
            <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground mt-1">
              総ボリューム
            </div>
          </div>

          <div>
            <div className="text-lg font-black tabular-nums leading-none">
              {summary.totalSets}
            </div>
            <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground mt-1">
              総セット
            </div>
          </div>

          <div>
            {delta === null ? (
              <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                NEW
              </span>
            ) : (
              <span
                className={`text-xs font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                  delta >= 0
                    ? "text-green-600 bg-green-500/10"
                    : "text-red-600 bg-red-500/10"
                }`}
              >
                {delta >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {delta >= 0 ? "+" : ""}
                {Math.round(delta)}%
              </span>
            )}
            <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground mt-1.5">
              先週比
            </div>
          </div>
        </div>

        {!hasData && (
          <p className="text-center text-[11px] text-muted-foreground mt-3">
            今週はまだ記録がありません
          </p>
        )}
      </div>
    </section>
  );
}
