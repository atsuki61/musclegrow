"use client";

import { HorizontalNav } from "./horizontal-nav";
import type { Exercise } from "@/types/workout";
import type { BodyPart } from "@/types/workout";

/**
 * 種目選択コンポーネント（横スクロール可能なナビゲーション）
 */
export function ExerciseSelector({
  exercises,
  selectedExerciseId,
  selectedBodyPart,
  exercisesWithData,
  onChange,
}: {
  exercises: Exercise[];
  selectedExerciseId: string | null;
  selectedBodyPart: BodyPart;
  exercisesWithData: Set<string>;
  onChange: (exerciseId: string) => void;
}) {
  // 部位でフィルタリング & データがある種目のみ
  const filteredExercises =
    selectedBodyPart === "all"
      ? exercises.filter((ex) => exercisesWithData.has(ex.id))
      : exercises.filter(
          (ex) =>
            ex.bodyPart === selectedBodyPart && exercisesWithData.has(ex.id)
        );

  const exerciseItems = filteredExercises.map((exercise) => ({
    value: exercise.id,
    label: exercise.name,
    className: exercise.isBig3 ? "border-2 font-semibold" : undefined,
  }));

  if (exerciseItems.length === 0) {
    return null;
  }

  return (
    <HorizontalNav
      items={exerciseItems}
      value={selectedExerciseId || exerciseItems[0]?.value || ""}
      onChange={(id) => onChange(id)}
    />
  );
}
