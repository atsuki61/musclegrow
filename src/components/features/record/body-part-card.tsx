"use client";

import { Card } from "@/components/ui/card";
import { getLastTrainedText, isCardioExercise } from "@/lib/utils";
import { MUSCLE_SUB_GROUP_LABELS } from "@/lib/exercise-mappings";
import type { Exercise, MuscleSubGroup } from "@/types/workout";

interface BodyPartCardProps {
  /** 部位名 */
  bodyPart: string;
  /** この部位の種目リスト */
  exercises: Exercise[];
  /** 種目ごとのMAX重量（種目IDをキーとする） */
  maxWeights?: Record<string, number>;
  /** 最後のトレーニング日時 */
  lastTrainedAt?: Date;
  /** 種目選択時のコールバック */
  onExerciseSelect?: (exercise: Exercise) => void;
  /** 種目追加ボタンクリック時のコールバック */
  onAddExerciseClick?: () => void;
}

/**
 * 部位カードコンポーネント
 * サブ分類ごとにグループ化し、3行×n列のグリッドレイアウトで種目を表示
 */
export function BodyPartCard({
  bodyPart,
  exercises,
  maxWeights = {},
  lastTrainedAt,
  onExerciseSelect,
  onAddExerciseClick,
}: BodyPartCardProps) {
  // サブ分類ごとに種目をグループ化
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const subGroup = exercise.muscleSubGroup || "other";
    if (!acc[subGroup]) {
      acc[subGroup] = [];
    }
    acc[subGroup].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  return (
    <Card className="p-4">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{bodyPart}</h2>
        <span className="text-sm text-muted-foreground">
          {getLastTrainedText(lastTrainedAt)}
        </span>
      </div>

      {/* サブ分類ごとのグループ */}
      <div className="space-y-6">
        {Object.entries(groupedExercises).map(
          ([subGroup, subGroupExercises]) => (
            <div key={subGroup}>
              {/* サブ分類見出し */}
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {MUSCLE_SUB_GROUP_LABELS[subGroup as MuscleSubGroup] ||
                  subGroup}
              </h3>

              {/* 種目グリッド（3行×n列） */}
              <div className="grid grid-cols-3 gap-2">
                {subGroupExercises
                  .filter((exercise) => exercise.tier === "initial")
                  .map((exercise) => {
                    const maxWeight = maxWeights[exercise.id];
                    const isCardio = isCardioExercise(exercise);
                    return (
                      <button
                        key={exercise.id}
                        onClick={() => onExerciseSelect?.(exercise)}
                        className="flex flex-col items-center justify-center rounded-lg border bg-card p-3 text-center transition-colors hover:bg-muted active:bg-muted/80"
                      >
                        <span className="text-sm font-medium">
                          {exercise.name}
                        </span>
                        {/* 有酸素種目以外の場合のみMAX重量を表示 */}
                        {!isCardio && (
                          <span className="mt-1 text-xs text-muted-foreground">
                            MAX {maxWeight ? `${maxWeight}kg` : "-- kg"}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )
        )}
      </div>

      {/* フッター */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={onAddExerciseClick}
          className="flex-1 rounded-md border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          種目を追加
        </button>
        <button className="flex-1 rounded-md border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
          すべて表示
        </button>
      </div>
    </Card>
  );
}
