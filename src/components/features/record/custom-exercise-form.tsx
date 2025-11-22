"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  BodyPart,
  Exercise,
  EquipmentType,
  MuscleSubGroup,
} from "@/types/workout";
import { BODY_PART_LABELS } from "@/lib/utils";
import { exerciseSchema, getValidationErrorDetails } from "@/lib/validations";

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
    { value: "back_width", label: "幅" },
    { value: "back_thickness", label: "厚み" },
    { value: "back_traps", label: "僧帽筋・下部" },
  ],
  legs: [
    { value: "legs_quads", label: "大腿四頭筋" },
    { value: "legs_hamstrings", label: "ハムストリングス" },
    { value: "legs_glutes", label: "臀筋" },
    { value: "legs_calves", label: "下腿" },
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
  ],
  core: [
    { value: "core_rectus", label: "腹直筋" },
    { value: "core_transverse", label: "腹横筋" },
    { value: "core_obliques", label: "腹斜筋" },
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
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg">カスタム種目の詳細</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
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
      </CardContent>
    </Card>
  );
}
