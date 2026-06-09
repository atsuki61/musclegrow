"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Badge } from "@/components/ui/badge";
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
import { BODY_PART_LABELS, cn } from "@/lib/utils";
import { exerciseSchema, getValidationErrorDetails } from "@/lib/validations";
import {
  getBodyPartForMuscleSubGroup,
  getDefaultTargetMuscleGroups,
  getTargetMuscleGroupLabels,
  isOverallMuscleSubGroup,
  TARGET_MUSCLE_GROUP_OPTIONS,
  TARGET_MUSCLE_GROUP_OPTIONS_BY_PART,
} from "@/lib/exercise-mappings";
import { ExerciseIllustrationVisual } from "./exercise-card-primitives";

type TargetBodyPart = Exclude<BodyPart, "all" | "other">;
type TargetMuscleSection = {
  id: string;
  title: string;
  description?: string;
  density: "normal" | "compact";
  options: typeof TARGET_MUSCLE_GROUP_OPTIONS;
};

const TARGET_BODY_PARTS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
] as const satisfies TargetBodyPart[];

const RELATED_TARGET_GROUPS_BY_PART: Record<TargetBodyPart, MuscleSubGroup[]> = {
  chest: ["arms_triceps", "shoulders_front"],
  back: ["arms_biceps", "shoulders_rear"],
  legs: ["core_rectus", "core_hip_flexors"],
  shoulders: ["arms_triceps", "chest_upper"],
  arms: ["chest_overall", "back_width", "shoulders_overall"],
  core: ["legs_quads", "legs_glutes", "legs_hamstrings"],
};

function getTargetBodyPart(bodyPart: Exclude<BodyPart, "all">) {
  return bodyPart === "other" ? undefined : bodyPart;
}

function createTargetMuscleSections(
  bodyPart: Exclude<BodyPart, "all">
): TargetMuscleSection[] {
  const targetBodyPart = getTargetBodyPart(bodyPart);
  const usedGroups = new Set<MuscleSubGroup>();
  const sections: TargetMuscleSection[] = [];

  if (targetBodyPart) {
    const mainOptions = TARGET_MUSCLE_GROUP_OPTIONS_BY_PART[targetBodyPart].map(
      (option) => ({ ...option, bodyPart: targetBodyPart })
    );
    mainOptions.forEach((option) => usedGroups.add(option.value));
    sections.push({
      id: "main",
      title: `${BODY_PART_LABELS[targetBodyPart]}の対象筋`,
      description: "主に狙う筋肉",
      density: "normal",
      options: mainOptions,
    });

    const relatedOptions = RELATED_TARGET_GROUPS_BY_PART[targetBodyPart]
      .map((value) =>
        TARGET_MUSCLE_GROUP_OPTIONS.find((option) => option.value === value)
      )
      .filter((option): option is typeof TARGET_MUSCLE_GROUP_OPTIONS[number] =>
        Boolean(option)
      )
      .filter((option) => !usedGroups.has(option.value));

    relatedOptions.forEach((option) => usedGroups.add(option.value));
    sections.push({
      id: "related",
      title: "入りやすい補助部位",
      description: "複合種目で一緒に効きやすい筋肉",
      density: "normal",
      options: relatedOptions,
    });
  }

  const otherOptions = TARGET_MUSCLE_GROUP_OPTIONS.filter(
    (option) => !usedGroups.has(option.value)
  ).sort((current, next) => {
    return (
      TARGET_BODY_PARTS.indexOf(current.bodyPart) -
      TARGET_BODY_PARTS.indexOf(next.bodyPart)
    );
  });

  sections.push({
    id: "other",
    title: targetBodyPart ? "その他の部位も追加" : "対象筋",
    description: targetBodyPart ? "必要な場合だけ追加" : undefined,
    density: targetBodyPart ? "compact" : "normal",
    options: otherOptions,
  });

  return sections.filter((section) => section.options.length > 0);
}

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
  const [isAdditionalTargetsOpen, setIsAdditionalTargetsOpen] =
    useState(false);

  const targetMuscleLabels = getTargetMuscleGroupLabels(targetMuscleGroups);
  const primaryTargetMuscleGroup = targetMuscleGroups[0];
  const selectedTargetBodyPart = getTargetBodyPart(bodyPart);
  const targetMuscleSections = useMemo(
    () => createTargetMuscleSections(bodyPart),
    [bodyPart]
  );
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
    [
      bodyPart,
      equipment,
      exerciseName,
      primaryTargetMuscleGroup,
      targetMuscleGroups,
    ]
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
    setIsAdditionalTargetsOpen(false);
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
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
                  setIsAdditionalTargetsOpen(false);
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

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="target-muscle-groups"
                className="text-xs font-bold text-muted-foreground"
              >
                対象筋
              </Label>
              <div
                id="target-muscle-groups"
                className={cn(
                  "rounded-xl border border-border/70 bg-muted/15 p-3",
                  errors.targetMuscleGroups && "border-destructive"
                )}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-black text-muted-foreground">
                      選択中
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {targetMuscleLabels.length > 0 ? (
                        targetMuscleLabels.map((label) => (
                          <Badge key={label} variant="secondary">
                            {label}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">未選択</Badge>
                      )}
                    </div>
                  </div>

                  {targetMuscleSections.map((section) => (
                    <div key={section.id} className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-black text-muted-foreground">
                            {section.title}
                          </p>
                          {section.description && (
                            <p className="mt-0.5 text-[10px] font-medium text-muted-foreground/80">
                              {section.description}
                            </p>
                          )}
                        </div>
                        {section.id === "other" && selectedTargetBodyPart && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setIsAdditionalTargetsOpen((current) => !current)
                            }
                            className="h-7 shrink-0 rounded-md px-2 text-[11px] font-black"
                          >
                            {isAdditionalTargetsOpen ? "閉じる" : "表示"}
                          </Button>
                        )}
                      </div>
                      {(section.id !== "other" ||
                        !selectedTargetBodyPart ||
                        isAdditionalTargetsOpen) && (
                        <div
                          className={cn(
                            "grid gap-1.5",
                            section.density === "compact"
                              ? "grid-cols-2"
                              : "grid-cols-1"
                          )}
                        >
                          {section.options.map((option) => {
                            const isSelected = targetMuscleGroups.includes(
                              option.value
                            );
                            const optionBodyPartColor = `var(--color-${option.bodyPart})`;

                            return (
                              <Button
                                key={option.value}
                                type="button"
                                variant="outline"
                                aria-pressed={isSelected}
                                onClick={() =>
                                  handleTargetMuscleGroupChange(
                                    option.value,
                                    !isSelected
                                  )
                                }
                                className={cn(
                                  "h-auto min-h-10 justify-start rounded-lg px-2.5 py-2 text-left text-xs font-bold leading-snug whitespace-normal",
                                  section.density === "compact" &&
                                    "min-h-8 px-2 py-1.5 text-[11px]",
                                  isSelected
                                    ? "bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                                    : "bg-background/35 text-muted-foreground"
                                )}
                                style={
                                  isSelected
                                    ? {
                                        borderColor: `color-mix(in srgb, ${optionBodyPartColor} 48%, transparent)`,
                                        color: optionBodyPartColor,
                                      }
                                    : undefined
                                }
                              >
                                {option.label}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {errors.targetMuscleGroups && (
                <p className="mt-1 text-xs text-destructive">
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
