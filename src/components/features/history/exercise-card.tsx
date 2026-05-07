"use client";

import { Trophy, ChevronsLeft } from "lucide-react";
import { BODY_PART_LABELS, calculate1RM, cn } from "@/lib/utils";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
import { ExerciseIllustrationVisual } from "@/components/features/record/exercise-card-primitives";
import { MUSCLE_SUB_GROUP_LABELS } from "@/lib/exercise-mappings";

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
  const bodyPartColor = `var(--color-${exercise.bodyPart})`;
  const subGroupLabel = exercise.muscleSubGroup
    ? MUSCLE_SUB_GROUP_LABELS[exercise.muscleSubGroup] ?? "全体"
    : "全体";

  return (
    <div
      className="group w-full cursor-pointer rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[transform,border-color,background-color,box-shadow] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.025] active:scale-[0.99]"
      onClick={onClick}
    >
      <div className="mb-3 grid grid-cols-[78px_1fr_auto] items-center gap-3">
        <div
          className="relative h-[74px] overflow-hidden rounded-xl border"
          style={{
            backgroundColor: `color-mix(in srgb, ${bodyPartColor} 12%, transparent)`,
            borderColor: `color-mix(in srgb, ${bodyPartColor} 28%, transparent)`,
          }}
        >
          <div className="absolute inset-1">
            <ExerciseIllustrationVisual
              exercise={exercise}
              fallbackLabel={subGroupLabel}
              imageClassName="max-h-[72px]"
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-black leading-none"
              style={{
                backgroundColor: `color-mix(in srgb, ${bodyPartColor} 16%, transparent)`,
                color: bodyPartColor,
              }}
            >
              {BODY_PART_LABELS[exercise.bodyPart]}
            </span>
            <span className="rounded-md bg-muted/55 px-1.5 py-0.5 text-[10px] font-bold leading-none text-muted-foreground">
              {subGroupLabel}
            </span>
          </div>
          <h4 className="break-words text-base font-black leading-tight text-foreground">
            {exercise.name}
          </h4>
          {maxWeight > 0 && (
            <p className="mt-1 text-[11px] font-black text-primary">
              MAX {maxWeight}kg
            </p>
          )}
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
                  "flex items-center justify-between rounded-xl px-2.5 py-2 text-sm transition-colors",
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
                        //文字色をprimaryに変更
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
                  {/*MAXバッジの色とアイコンfillをprimaryに変更 */}
                  {isMaxWeight && (
                    <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary shadow-sm animate-in fade-in zoom-in duration-300 dark:bg-primary/30">
                      <Trophy className="w-2.5 h-2.5 fill-primary text-primary" />
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
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm hover:bg-muted/30"
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
