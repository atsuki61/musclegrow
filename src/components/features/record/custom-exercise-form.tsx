"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MUSCLE_SUB_GROUP_LABELS } from "@/lib/exercise-mappings";
import {
  ExerciseIllustrationVisual,
} from "./exercise-card-primitives";

const SUB_GROUP_OPTIONS: Record<
  Exclude<BodyPart, "all">,
  { value: MuscleSubGroup; label: string }[]
> = {
  chest: [
    { value: "chest_overall", label: "全体" },
    { value: "chest_upper", label: "上部" },
    { value: "chest_lower", label: "下部" },
    { value: "chest_outer", label: "外側" },
  ],
  back: [
    { value: "back_overall", label: "全体" },
    { value: "back_width", label: "広背筋（背中の幅）" },
    { value: "back_thickness", label: "僧帽筋・菱形筋（背中の厚み）" },
    { value: "back_traps", label: "僧帽筋（首の付け根～肩）" },
    { value: "back_erectors", label: "脊柱起立筋（腰～背中下部）" },
  ],
  legs: [
    { value: "legs_quads", label: "大腿四頭筋" },
    { value: "legs_hamstrings", label: "ハムストリングス" },
    { value: "legs_glutes", label: "臀筋" },
    { value: "legs_calves", label: "下腿" },
    { value: "legs_adductors", label: "内転筋" },
  ],
  shoulders: [
    { value: "shoulders_overall", label: "全体" },
    { value: "shoulders_front", label: "前部" },
    { value: "shoulders_middle", label: "中部" },
    { value: "shoulders_rear", label: "後部" },
  ],
  arms: [
    { value: "arms_biceps", label: "上腕二頭筋" },
    { value: "arms_triceps", label: "上腕三頭筋" },
    { value: "arms_forearms", label: "前腕筋群" },
  ],
  core: [
    { value: "core_rectus", label: "腹直筋" },
    { value: "core_transverse", label: "腹横筋" },
    { value: "core_obliques", label: "腹斜筋" },
    { value: "core_hip_flexors", label: "腸腰筋" },
  ],
  other: [],
};

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
  const [subGroup, setSubGroup] = useState<MuscleSubGroup | "">("");
  const [exerciseName, setExerciseName] = useState("");
  const [equipment, setEquipment] = useState<EquipmentType>("other");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableSubGroups = SUB_GROUP_OPTIONS[bodyPart] || [];
  const selectedSubGroupLabel = subGroup
    ? MUSCLE_SUB_GROUP_LABELS[subGroup] ?? "全体"
    : "未選択";
  const previewExercise = useMemo<Exercise>(
    () => ({
      id: "custom-preview",
      name: exerciseName.trim() || "カスタム種目",
      bodyPart,
      muscleSubGroup: subGroup || undefined,
      primaryEquipment: equipment,
      tier: "custom",
      isBig3: false,
    }),
    [bodyPart, equipment, exerciseName, subGroup]
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
      muscleSubGroup: subGroup || undefined,
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

    if (availableSubGroups.length > 0 && !subGroup) {
      setErrors({
        muscleSubGroup: "サブ分類を選択してください",
      });
      return;
    }

    onAdd(customExercise);

    setExerciseName("");
    setSubGroup("");
    setEquipment("other");
    setErrors({});
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[118px_1fr] gap-3 rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="group relative h-[132px] overflow-hidden rounded-[1.15rem] border border-[var(--mg-border)] bg-background/45 p-2">
          <span
            className="absolute right-1.5 top-1.5 z-20 rounded-md border px-1.5 py-0.5 text-[9px] font-black leading-none shadow-sm backdrop-blur-md"
            style={{
              borderColor: `color-mix(in srgb, ${bodyPartColor} 35%, transparent)`,
              color: bodyPartColor,
            }}
          >
            確認
          </span>
          <div className="relative z-10 h-full pt-5">
            <ExerciseIllustrationVisual
              exercise={previewExercise}
              fallbackLabel={
                subGroup ? selectedSubGroupLabel : BODY_PART_LABELS[bodyPart]
              }
              imageClassName="max-h-[104px]"
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
            <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {selectedSubGroupLabel}
            </span>
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
          {/* 部位 & サブ分類 (2列) */}
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
                  setBodyPart(value as Exclude<BodyPart, "all">);
                  setSubGroup("");
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

            {availableSubGroups.length > 0 && (
              <div className="space-y-2">
                <Label
                  htmlFor="sub-group"
                  className="text-xs font-bold text-muted-foreground"
                >
                  サブ分類
                </Label>
                <Select
                  value={subGroup}
                  onValueChange={(value) => {
                    setSubGroup(value as MuscleSubGroup);
                    clearFieldError("muscleSubGroup");
                  }}
                >
                  <SelectTrigger
                    id="sub-group"
                    className={`h-11 ${
                      errors.muscleSubGroup ? "border-destructive" : ""
                    }`}
                  >
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubGroups.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.muscleSubGroup && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.muscleSubGroup}
                  </p>
                )}
              </div>
            )}
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
