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

/**
 * tier="initial"の種目のみをフィルタリング
 */
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

  // ハイドレーションエラー対策: クライアントサイドでのみMAX重量を表示する
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* 3列グリッドレイアウト */}
      <div className="grid grid-cols-3 gap-3">
        {initialExercises.map((exercise) => {
          // マウントされるまでは maxWeights を参照せず undefined (表示なし) にする
          const maxWeight = isMounted ? maxWeights[exercise.id] : undefined;

          const isCardio = isCardioExercise(exercise);
          // サブ部位ラベル
          const subGroupLabel = exercise.muscleSubGroup
            ? MUSCLE_SUB_GROUP_LABELS[exercise.muscleSubGroup as MuscleSubGroup]
            : "全体";

          return (
            <button
              key={exercise.id}
              onClick={() => onExerciseSelect?.(exercise)}
              className="group relative flex flex-col items-center justify-between aspect-square rounded-2xl border border-border/60 bg-card p-2 shadow-sm 
                transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                hover:scale-[1.03] hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10 hover:border-orange-500/40 hover:bg-orange-50/10
                active:scale-90 active:translate-y-0 active:shadow-none active:border-orange-500 active:bg-orange-50
                cursor-pointer select-none overflow-hidden"
            >
              {/* ホバー時の光沢エフェクト */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 via-orange-50/0 to-orange-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* MAX重量バッジ (右上) */}
              {!isCardio && (
                <div className="relative z-10 w-full flex justify-end h-5">
                  {/* マウント前は何も表示しないか、あるいはダミーを表示してレイアウトシフトを防ぐ */}
                  {/* ここでは「値がある場合のみ表示」するロジックなので、マウント前は非表示でOK */}
                  {isMounted && (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-md shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105",
                        maxWeight
                          ? "bg-orange-100 text-orange-700 border border-orange-200"
                          : "bg-muted text-muted-foreground/60 border border-border"
                      )}
                    >
                      {maxWeight ? `${maxWeight}kg` : "-"}
                    </span>
                  )}
                  {/* マウント前のプレースホルダー（高さを確保してガタつきを防ぐならこれを入れる） */}
                  {!isMounted && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted text-transparent border border-border opacity-30">
                      -
                    </span>
                  )}
                </div>
              )}

              {/* スペーサー */}
              {!isCardio ? null : <div className="h-4" />}

              {/* 種目名 */}
              <span className="relative z-10 text-xs font-bold text-center leading-tight line-clamp-2 px-1 w-full text-foreground/90 group-hover:text-orange-700 transition-colors duration-300">
                {exercise.name}
              </span>

              {/* 部位ラベル (下部) */}
              <span className="relative z-10 mt-1 px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted/50 rounded-full transition-colors duration-300 group-hover:bg-orange-100 group-hover:text-orange-600">
                {subGroupLabel || "全体"}
              </span>
            </button>
          );
        })}

        {/* 追加カード */}
        <button
          onClick={onAddExerciseClick}
          className="group relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 text-orange-500 
            transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
            hover:scale-[1.03] hover:-translate-y-1 hover:bg-orange-50 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20
            active:scale-90 active:translate-y-0 active:border-orange-500 active:shadow-none
            cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center mb-1 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">
            <Plus className="w-5 h-5 text-orange-600" />
          </div>
          <span className="text-xs font-bold text-orange-600">追加</span>
        </button>
      </div>

      {/* 種目がない場合のメッセージ */}
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
