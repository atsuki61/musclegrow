"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Exercise } from "@/types/workout";

/**
 * 種目選択コンポーネント
 */
export function ExerciseSelector({
  exercises,
  selectedExerciseId,
  onChange,
}: {
  exercises: Exercise[];
  selectedExerciseId: string | null;
  onChange: (exerciseId: string) => void;
}) {
  const exerciseItems = exercises.map((exercise) => ({
    value: exercise.id,
    label: exercise.name,
    isBig3: exercise.isBig3,
  }));

  if (exerciseItems.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs font-medium text-muted-foreground">種目</p>
      <Select
        value={selectedExerciseId ?? ""}
        onValueChange={(id) => onChange(id)}
      >
        <SelectTrigger
          aria-label="種目を選択"
          className="h-11 w-full rounded-xl bg-card px-4 shadow-sm"
        >
          <SelectValue placeholder="種目を選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {exerciseItems.map((exercise) => (
              <SelectItem
                key={exercise.value}
                value={exercise.value}
                className={exercise.isBig3 ? "font-semibold" : undefined}
              >
                {exercise.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
