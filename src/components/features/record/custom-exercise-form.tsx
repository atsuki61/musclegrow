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

/**
 * 部位ごとのサブ分類オプション
 */
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
    { value: "back_traps", label: "僧帽筋・下部（首の付け根～肩）" },
  ],
  legs: [
    { value: "legs_quads", label: "大腿四頭筋（太ももの前側）" },
    { value: "legs_hamstrings", label: "ハムストリングス（太ももの後側）" },
    { value: "legs_glutes", label: "臀筋（お尻）" },
    { value: "legs_calves", label: "下腿（ふくらはぎ）" },
  ],
  shoulders: [
    { value: "shoulders_overall", label: "全体" },
    { value: "shoulders_front", label: "前部" },
    { value: "shoulders_middle", label: "中部" },
    { value: "shoulders_rear", label: "後部" },
  ],
  arms: [
    { value: "arms_biceps", label: "上腕二頭筋（力こぶ）" },
    { value: "arms_triceps", label: "上腕三頭筋（二の腕の後ろ）" },
  ],
  core: [
    { value: "core_rectus", label: "腹直筋（お腹の前側）" },
    { value: "core_transverse", label: "腹横筋（お腹の深い部分）" },
    { value: "core_obliques", label: "腹斜筋（お腹の横側）" },
  ],
  other: [], // その他はサブ分類なし
};

/**
 * 機材タイプのオプション
 */
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
  /** 初期の部位（親コンポーネントから渡される） */
  initialBodyPart?: Exclude<BodyPart, "all">;
  /** カスタム種目を追加するコールバック */
  onAdd: (exercise: Exercise) => void;
  /** キャンセル時のコールバック */
  onCancel?: () => void;
}

/**
 * カスタム種目追加フォームコンポーネント
 * 部位、サブ分類、種目名、機材タイプを入力してカスタム種目を作成
 */
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

  // サブ分類オプションを取得
  const availableSubGroups = SUB_GROUP_OPTIONS[bodyPart] || [];

  /**
   * フォームを送信する
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!exerciseName.trim()) {
      return;
    }

    // サブ分類が必須の部位で未選択の場合はエラー
    if (availableSubGroups.length > 0 && !subGroup) {
      return;
    }

    // カスタム種目を作成
    const customExercise: Exercise = {
      id: nanoid(),
      name: exerciseName.trim(),
      bodyPart,
      muscleSubGroup: subGroup || undefined,
      primaryEquipment: equipment,
      tier: "custom",
      isBig3: false,
    };

    onAdd(customExercise);

    // フォームをリセット
    setExerciseName("");
    setSubGroup("");
    setEquipment("other");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">カスタム種目を追加</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 部位選択 */}
          <div className="space-y-2">
            <Label htmlFor="body-part">部位</Label>
            <Select
              value={bodyPart}
              onValueChange={(value) => {
                setBodyPart(value as Exclude<BodyPart, "all">);
                setSubGroup(""); // 部位変更時にサブ分類をリセット
              }}
            >
              <SelectTrigger id="body-part">
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

          {/* サブ分類選択（該当する部位のみ） */}
          {availableSubGroups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="sub-group">サブ分類</Label>
              <Select
                value={subGroup}
                onValueChange={(value) =>
                  setSubGroup(value as MuscleSubGroup)
                }
              >
                <SelectTrigger id="sub-group">
                  <SelectValue placeholder="サブ分類を選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubGroups.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 種目名入力 */}
          <div className="space-y-2">
            <Label htmlFor="exercise-name">種目名</Label>
            <Input
              id="exercise-name"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="例: カスタムベンチプレス"
              required
            />
          </div>

          {/* 機材タイプ選択（オプション） */}
          <div className="space-y-2">
            <Label htmlFor="equipment">機材タイプ（オプション）</Label>
            <Select
              value={equipment}
              onValueChange={(value) =>
                setEquipment(value as EquipmentType)
              }
            >
              <SelectTrigger id="equipment">
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
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              追加
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                キャンセル
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

