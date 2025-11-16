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
  onChange,
}: {
  exercises: Exercise[];
  selectedExerciseId: string | null;
  selectedBodyPart: BodyPart;
  onChange: (exerciseId: string) => void;
}) {
  // 部位でフィルタリング
  const filteredExercises =
    selectedBodyPart === "all"
      ? exercises
      : selectedBodyPart === "big3"
      ? exercises.filter((ex) => ex.isBig3)
      : exercises.filter((ex) => ex.bodyPart === selectedBodyPart);

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
