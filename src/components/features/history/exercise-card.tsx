"use client";

import { Trophy, ChevronsLeft } from "lucide-react";
import { BODY_PART_LABELS, calculate1RM, cn } from "@/lib/utils";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";

interface ExerciseCardProps {
  exercise: Exercise;
  sets?: SetRecord[];
  records?: CardioRecord[];
  onClick?: () => void;
  maxWeights?: Record<string, number>;
  showSwipeHint?: boolean;
}

export function ExerciseCard({
  exercise,
  sets,
  records,
  onClick,
  maxWeights = {},
  showSwipeHint = false,
}: ExerciseCardProps) {
  const maxWeight = maxWeights[exercise.id] || 0;

  return (
    <div
      className="w-full p-3 bg-card rounded-xl border shadow-sm transition-all hover:shadow-md active:bg-muted/40 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
            {BODY_PART_LABELS[exercise.bodyPart]}
          </span>
          <span className="font-bold text-sm truncate text-foreground/90">
            {exercise.name}
          </span>
        </div>

        {showSwipeHint && (
          <ChevronsLeft className="h-4 w-4 text-muted-foreground/20 animate-pulse shrink-0" />
        )}
      </div>

      {/* セット記録 */}
      {sets && sets.length > 0 && (
        <div className="space-y-1">
          {sets.map((set, index) => {
            const weight = set.weight ?? 0;
            const isMaxWeight = maxWeight > 0 && weight >= maxWeight;
            const oneRM =
              weight > 0 && set.reps > 0
                ? calculate1RM(weight, set.reps)
                : null;

            return (
              <div
                key={set.id || index}
                className={cn(
                  "flex items-center justify-between text-sm py-1.5 px-2 rounded-lg transition-colors",
                  // 修正: MAX記録時の背景色をprimary系に変更
                  isMaxWeight
                    ? "bg-primary/10 dark:bg-primary/20"
                    : "hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground/40 font-mono w-3 text-right">
                    {set.setOrder || index + 1}
                  </span>

                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "font-bold tabular-nums text-base",
                        // 修正: 文字色をprimaryに変更
                        isMaxWeight
                          ? "text-primary font-black"
                          : "text-foreground"
                      )}
                    >
                      {weight > 0 ? weight : "-"}
                    </span>
                    <span className="text-xs text-muted-foreground">kg</span>
                  </div>

                  <span className="text-xs text-muted-foreground/30">×</span>

                  <div className="flex items-baseline gap-1">
                    <span className="font-bold tabular-nums text-base text-foreground">
                      {set.reps}
                    </span>
                    <span className="text-xs text-muted-foreground">回</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* 修正: MAXバッジの色とアイコンfillをprimaryに変更 */}
                  {isMaxWeight && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-primary bg-primary/10 dark:bg-primary/30 px-1.5 py-0.5 rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
                      <Trophy className="w-2.5 h-2.5 fill-primary text-primary" />{" "}
                      MAX
                    </span>
                  )}

                  {oneRM && (
                    <span className="text-[10px] text-muted-foreground tabular-nums opacity-70">
                      1RM:{Math.round(oneRM)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 有酸素記録 */}
      {records && records.length > 0 && (
        <div className="space-y-1">
          {records.map((record, index) => {
            return (
              <div
                key={record.id || index}
                className="flex items-center gap-3 text-sm py-1.5 px-2 rounded-lg hover:bg-muted/30"
              >
                <span className="text-xs text-muted-foreground/40 font-mono w-3 text-right">
                  {index + 1}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-bold tabular-nums text-base">
                    {record.duration}
                  </span>
                  <span className="text-xs text-muted-foreground">分</span>
                </div>
                {record.distance && (
                  <>
                    <span className="text-xs text-muted-foreground/30">/</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold tabular-nums text-base">
                        {record.distance}
                      </span>
                      <span className="text-xs text-muted-foreground">km</span>
                    </div>
                  </>
                )}
                {record.calories && (
                  <>
                    <span className="text-xs text-muted-foreground/30">/</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold tabular-nums text-base">
                        {record.calories}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        kcal
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
