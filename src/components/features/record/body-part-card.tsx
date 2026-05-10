"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { cn, isCardioExercise } from "@/lib/utils";
import { getExerciseTargetMuscleLabels } from "@/lib/exercise-mappings";
import {
  ExerciseIllustrationVisual,
  ExerciseName,
} from "./exercise-card-primitives";
import type { Exercise } from "@/types/workout";

interface BodyPartCardProps {
  bodyPart: string;
  exercises: Exercise[];
  maxWeights?: Record<string, number>;
  onExerciseSelect?: (exercise: Exercise) => void;
  onAddExerciseClick?: () => void;
  isEditMode?: boolean;
  selectedDate?: Date;
}

function filterInitialExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter((exercise) => exercise.tier === "initial");
}

export function BodyPartCard({
  exercises,
  maxWeights = {},
  onExerciseSelect,
  onAddExerciseClick,
  isEditMode = false, // デフォルトfalse
}: BodyPartCardProps) {
  const initialExercises = useMemo(
    () => filterInitialExercises(exercises),
    [exercises]
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {initialExercises.map((exercise) => {
          const maxWeight = isMounted ? maxWeights[exercise.id] : undefined;
          const isCardio = isCardioExercise(exercise);
          const targetMuscleLabels = getExerciseTargetMuscleLabels(exercise);
          const fallbackLabel = targetMuscleLabels[0] ?? "全体";
          return (
            <button
              key={exercise.id}
              onClick={() => onExerciseSelect?.(exercise)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onExerciseSelect?.(exercise);
                }
              }}
              className={cn(
                "group relative aspect-[1/1.08] min-h-[128px] min-w-0 overflow-hidden rounded-[1.15rem] border text-left",
                "bg-[var(--mg-surface)] border-[var(--mg-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                "transition-[transform,border-color,background-color,box-shadow] duration-200 cursor-pointer select-none",
                isEditMode
                  ? "border-red-500/40 bg-red-500/[0.035] hover:border-red-400/70"
                  : "hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/[0.035] active:scale-[0.985]"
              )}
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/[0.045] via-transparent to-primary/[0.035] opacity-80" />

              {isEditMode && (
                <div className="absolute left-3 top-3 z-20 flex size-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm shadow-red-950/30">
                  <Minus className="size-5 stroke-[3]" />
                </div>
              )}

              {!isCardio && (
                <span
                  className={cn(
                    "absolute right-1.5 top-1.5 z-20 rounded-md border px-1.5 py-0.5 text-[9px] font-black leading-none tracking-normal shadow-sm backdrop-blur-md",
                    maxWeight
                      ? "border-primary/35 bg-[var(--mg-surface)]/90 text-primary"
                      : "border-border/60 bg-[var(--mg-surface)]/90 text-muted-foreground"
                  )}
                >
                  {maxWeight ? `MAX ${maxWeight}kg` : "MAX -"}
                </span>
              )}

              <div className="relative z-10 flex h-full flex-col px-2 pb-2.5 pt-2.5">
                <div className="relative min-h-0 flex-1 overflow-visible pt-5">
                  <div className="absolute inset-x-0 bottom-0 top-2">
                    <ExerciseIllustrationVisual
                      exercise={exercise}
                      fallbackLabel={fallbackLabel}
                      imageClassName="max-h-[104px]"
                    />
                  </div>
                </div>
                <ExerciseName name={exercise.name} />
              </div>
            </button>
          );
        })}

        <button
          onClick={isEditMode ? undefined : onAddExerciseClick}
          onKeyDown={(e) => {
            if (isEditMode) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onAddExerciseClick?.();
            }
          }}
          aria-disabled={isEditMode}
          className={cn(
            "group relative flex aspect-[1/1.08] min-h-[128px] items-center justify-center gap-2 rounded-[1.15rem] border-2 border-dashed border-primary/35 bg-primary/[0.045] text-primary",
            "transition-[transform,border-color,background-color,opacity] duration-200 active:scale-[0.985]",
            isEditMode
              ? "cursor-not-allowed opacity-45"
              : "cursor-pointer hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10"
          )}
        >
          <Plus className="size-5" />
          <span className="text-xs font-black">種目を追加</span>
        </button>
      </div>

      {initialExercises.length === 0 && (
        <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-3 animate-bounce">
            <Plus className="w-6 h-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            種目が見つかりません
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            新しい種目を追加してみましょう
          </p>
        </div>
      )}
    </div>
  );
}
