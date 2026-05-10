"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BodyPart,
  Exercise,
  EquipmentType,
  MuscleSubGroup,
} from "@/types/workout";
import { BODY_PART_LABELS } from "@/lib/utils";
import { exerciseSchema, getValidationErrorDetails } from "@/lib/validations";
import {
  getBodyPartForMuscleSubGroup,
  getDefaultTargetMuscleGroups,
  getTargetMuscleGroupLabels,
  isOverallMuscleSubGroup,
  TARGET_MUSCLE_GROUP_OPTIONS_BY_PART,
} from "@/lib/exercise-mappings";
import { ExerciseIllustrationVisual } from "./exercise-card-primitives";

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: "barbell", label: "バーベル" },
  { value: "dumbbell", label: "ダンベル" },
  { value: "machine", label: "マシン" },
  { value: "cable", label: "ケーブル" },
  { value: "bodyweight", label: "自重" },
  { value: "kettlebell", label: "ケトルベル" },
  { value: "other", label: "その他" },
];

interface CustomExerciseFormProps {
  initialBodyPart?: Exclude<BodyPart, "all">;
  onAdd: (exercise: Exercise) => void;
  onCancel?: () => void;
}

export function CustomExerciseForm({
  initialBodyPart,
  onAdd,
  onCancel,
}: CustomExerciseFormProps) {
  const [bodyPart, setBodyPart] = useState<Exclude<BodyPart, "all">>(
    initialBodyPart || "chest"
  );
  const [targetMuscleGroups, setTargetMuscleGroups] = useState<
    MuscleSubGroup[]
  >(() => getDefaultTargetMuscleGroups(initialBodyPart || "chest"));
  const [exerciseName, setExerciseName] = useState("");
  const [equipment, setEquipment] = useState<EquipmentType>("other");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const targetMuscleLabels = getTargetMuscleGroupLabels(targetMuscleGroups);
  const primaryTargetMuscleGroup = targetMuscleGroups[0];
  const previewExercise = useMemo<Exercise>(
    () => ({
      id: "custom-preview",
      name: exerciseName.trim() || "カスタム種目",
      bodyPart,
      muscleSubGroup: primaryTargetMuscleGroup,
      targetMuscleGroups:
        targetMuscleGroups.length > 0 ? [...targetMuscleGroups] : undefined,
      primaryEquipment: equipment,
      tier: "custom",
      isBig3: false,
    }),
    [bodyPart, equipment, exerciseName, primaryTargetMuscleGroup, targetMuscleGroups]
  );
  const bodyPartColor = `var(--color-${bodyPart})`;

  const clearFieldError = (fieldName: string) => {
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const customExercise: Exercise = {
      id: nanoid(),
      name: exerciseName.trim(),
      bodyPart,
      muscleSubGroup: primaryTargetMuscleGroup,
      targetMuscleGroups:
        targetMuscleGroups.length > 0 ? [...targetMuscleGroups] : undefined,
      primaryEquipment: equipment,
      tier: "custom",
      isBig3: false,
    };

    const result = exerciseSchema.safeParse(customExercise);

    if (!result.success) {
      const errorDetails = getValidationErrorDetails(result.error);
      setErrors(errorDetails);
      return;
    }

    if (bodyPart !== "other" && targetMuscleGroups.length === 0) {
      setErrors({
        targetMuscleGroups: "対象筋を選択してください",
      });
      return;
    }

    onAdd(customExercise);

    setExerciseName("");
    setTargetMuscleGroups(getDefaultTargetMuscleGroups(bodyPart));
    setEquipment("other");
    setErrors({});
  };

  const handleTargetMuscleGroupChange = (
    muscleSubGroup: MuscleSubGroup,
    isChecked: boolean
  ) => {
    clearFieldError("targetMuscleGroups");

    setTargetMuscleGroups((currentGroups) => {
      if (!isChecked) {
        return currentGroups.filter((group) => group !== muscleSubGroup);
      }

      const targetBodyPart = getBodyPartForMuscleSubGroup(muscleSubGroup);
      let nextGroups = currentGroups.filter((group) => group !== muscleSubGroup);

      if (targetBodyPart) {
        if (isOverallMuscleSubGroup(muscleSubGroup)) {
          nextGroups = nextGroups.filter(
            (group) => getBodyPartForMuscleSubGroup(group) !== targetBodyPart
          );
        } else {
          nextGroups = nextGroups.filter(
            (group) =>
              getBodyPartForMuscleSubGroup(group) !== targetBodyPart ||
              !isOverallMuscleSubGroup(group)
          );
        }
      }

      return [...nextGroups, muscleSubGroup];
    });
  };

  const selectedTargetSummary =
    targetMuscleLabels.length > 0
      ? targetMuscleLabels.join("、")
      : "対象筋を選択";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[132px_minmax(0,1fr)] gap-3 rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="group relative h-[150px] overflow-hidden rounded-[1.15rem] border border-[var(--mg-border)] bg-background/45 p-2">
          <div className="absolute inset-0 bg-linear-to-br from-white/[0.045] via-transparent to-primary/[0.035] opacity-80" />
          <span
            className="absolute right-1.5 top-1.5 z-20 rounded-md border px-1.5 py-0.5 text-[9px] font-black leading-none shadow-sm backdrop-blur-md"
            style={{
              borderColor: `color-mix(in srgb, ${bodyPartColor} 35%, transparent)`,
              color: bodyPartColor,
            }}
          >
            確認
          </span>
          <div className="absolute inset-x-1 top-7 bottom-2 z-10">
            <ExerciseIllustrationVisual
              exercise={previewExercise}
              fallbackLabel={
                targetMuscleLabels[0] ?? BODY_PART_LABELS[bodyPart]
              }
              imageClassName="max-h-[116px]"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <p className="mb-2 text-xs font-black text-muted-foreground">
            作成前に確認
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-black"
              style={{
                backgroundColor: `color-mix(in srgb, ${bodyPartColor} 16%, transparent)`,
                color: bodyPartColor,
              }}
            >
              {BODY_PART_LABELS[bodyPart]}
            </span>
            {targetMuscleLabels.length > 0 ? (
              targetMuscleLabels.slice(0, 3).map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground"
                >
                  {label}
                </span>
              ))
            ) : (
              <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                未選択
              </span>
            )}
          </div>
          <p className="mt-3 text-sm font-bold leading-snug text-foreground">
            {previewExercise.name}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {EQUIPMENT_OPTIONS.find((option) => option.value === equipment)
              ?.label ?? "その他"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
          {/* 部位 & 対象筋 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="body-part"
                className="text-xs font-bold text-muted-foreground"
              >
                部位
              </Label>
              <Select
                value={bodyPart}
                onValueChange={(value) => {
                  const nextBodyPart = value as Exclude<BodyPart, "all">;
                  setBodyPart(nextBodyPart);
                  setTargetMuscleGroups(
                    getDefaultTargetMuscleGroups(nextBodyPart)
                  );
                  clearFieldError("targetMuscleGroups");
                }}
              >
                <SelectTrigger id="body-part" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BODY_PART_LABELS)
                    .filter(([key]) => key !== "all")
                    .map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="target-muscle-groups"
                className="text-xs font-bold text-muted-foreground"
              >
                対象筋
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="target-muscle-groups"
                    type="button"
                    variant="outline"
                    className={`h-11 w-full justify-between rounded-md px-3 text-left font-medium ${
                      errors.targetMuscleGroups ? "border-destructive" : ""
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      {selectedTargetSummary}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="max-h-[360px] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto p-3"
                >
                  <div className="space-y-4">
                    {Object.entries(TARGET_MUSCLE_GROUP_OPTIONS_BY_PART).map(
                      ([part, options]) => (
                        <div key={part} className="space-y-2">
                          <p className="text-xs font-black text-muted-foreground">
                            {
                              BODY_PART_LABELS[
                                part as Exclude<BodyPart, "all">
                              ]
                            }
                          </p>
                          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            {options.map((option) => {
                              const checkboxId = `target-${option.value}`;
                              return (
                                <div
                                  key={option.value}
                                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/25 px-2 py-2"
                                >
                                  <Checkbox
                                    id={checkboxId}
                                    checked={targetMuscleGroups.includes(
                                      option.value
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleTargetMuscleGroupChange(
                                        option.value,
                                        checked === true
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={checkboxId}
                                    className="min-w-0 flex-1 cursor-pointer text-xs font-bold leading-snug"
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {errors.targetMuscleGroups && (
                <p className="text-xs text-destructive mt-1">
                  {errors.targetMuscleGroups}
                </p>
              )}
            </div>
          </div>

          {/* 種目名 */}
          <div className="space-y-2">
            <Label
              htmlFor="exercise-name"
              className="text-xs font-bold text-muted-foreground"
            >
              種目名
            </Label>
            <Input
              id="exercise-name"
              value={exerciseName}
              onChange={(e) => {
                setExerciseName(e.target.value);
                clearFieldError("name");
              }}
              placeholder="例: インクライン・ダンベルプレス"
              required
              className={`h-11 ${errors.name ? "border-destructive" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          {/* 機材タイプ */}
          <div className="space-y-2">
            <Label
              htmlFor="equipment"
              className="text-xs font-bold text-muted-foreground"
            >
              機材タイプ（任意）
            </Label>
            <Select
              value={equipment}
              onValueChange={(value) => setEquipment(value as EquipmentType)}
            >
              <SelectTrigger id="equipment" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-12 rounded-xl"
              >
                キャンセル
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
            >
              追加する
            </Button>
          </div>
      </form>
    </div>
  );
}
