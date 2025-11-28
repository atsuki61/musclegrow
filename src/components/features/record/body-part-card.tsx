"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn, isCardioExercise } from "@/lib/utils";
import { MUSCLE_SUB_GROUP_LABELS } from "@/lib/exercise-mappings";
import type { Exercise, MuscleSubGroup } from "@/types/workout";

interface BodyPartCardProps {
  bodyPart: string;
  exercises: Exercise[];
  maxWeights?: Record<string, number>;
  onExerciseSelect?: (exercise: Exercise) => void;
  onAddExerciseClick?: () => void;
}

function filterInitialExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter((exercise) => exercise.tier === "initial");
}

export function BodyPartCard({
  exercises,
  maxWeights = {},
  onExerciseSelect,
  onAddExerciseClick,
}: BodyPartCardProps) {
  const initialExercises = filterInitialExercises(exercises);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {initialExercises.map((exercise) => {
          const maxWeight = isMounted ? maxWeights[exercise.id] : undefined;
          const isCardio = isCardioExercise(exercise);
          const subGroupLabel = exercise.muscleSubGroup
            ? MUSCLE_SUB_GROUP_LABELS[exercise.muscleSubGroup as MuscleSubGroup]
            : "全体";

          return (
            <button
              key={exercise.id}
              onClick={() => onExerciseSelect?.(exercise)}
              className="group relative flex flex-col items-center justify-between aspect-square rounded-2xl border border-border/60 bg-card p-2 shadow-sm 
                  transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                  hover:scale-[1.03] hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40 hover:bg-primary/5
                  active:scale-90 active:translate-y-0 active:shadow-none active:border-primary active:bg-primary/10
                  cursor-pointer select-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {!isCardio && (
                <div className="relative z-10 w-full flex justify-end h-5">
                  {isMounted && (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-md shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105",
                        // 修正: orange固定からprimaryに変更
                        maxWeight
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground/60 border border-border"
                      )}
                    >
                      {maxWeight ? `${maxWeight}kg` : "-"}
                    </span>
                  )}
                  {!isMounted && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted text-transparent border border-border opacity-30">
                      -
                    </span>
                  )}
                </div>
              )}

              {!isCardio ? null : <div className="h-4" />}

              {/* 修正: 文字色を text-foreground にして視認性向上 (ダークモード対策) */}
              <span className="relative z-10 text-xs font-bold text-center leading-tight line-clamp-2 px-1 w-full text-foreground group-hover:text-primary transition-colors duration-300">
                {exercise.name}
              </span>

              {/* 修正: バッジ色を primary ベースに変更 */}
              <span className="relative z-10 mt-1 px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted/50 rounded-full transition-colors duration-300 group-hover:bg-primary/10 group-hover:text-primary">
                {" "}
                {subGroupLabel || "全体"}
              </span>
            </button>
          );
        })}

        {/* 追加カード */}
        <button
          onClick={onAddExerciseClick}
          className="group relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary 
            transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
            hover:scale-[1.03] hover:-translate-y-1 hover:bg-primary/10 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20
            active:scale-90 active:translate-y-0 active:border-primary active:shadow-none
            cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/20 flex items-center justify-center mb-1 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-bold text-primary">追加</span>
        </button>
      </div>

      {initialExercises.length === 0 && (
        <div className="col-span-3 py-12 text-center animate-in fade-in zoom-in duration-500">
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
