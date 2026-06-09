import type { BodyPart, Exercise, MuscleSubGroup } from "@/types/workout";
import {
  MUSCLE_SUB_GROUPS,
  MUSCLE_SUB_GROUP_LABELS,
} from "@/constants/body-parts";

export { MUSCLE_SUB_GROUP_LABELS };

const TARGET_PARTS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
] as const satisfies Exclude<BodyPart, "all" | "other">[];

export type TargetMuscleGroupOption = {
  value: MuscleSubGroup;
  label: string;
};

export const TARGET_MUSCLE_GROUP_OPTIONS_BY_PART: Record<
  Exclude<BodyPart, "all" | "other">,
  TargetMuscleGroupOption[]
> = {
  chest: [
    { value: MUSCLE_SUB_GROUPS.CHEST_OVERALL, label: "大胸筋全体" },
    { value: MUSCLE_SUB_GROUPS.CHEST_UPPER, label: "大胸筋上部" },
    { value: MUSCLE_SUB_GROUPS.CHEST_LOWER, label: "大胸筋下部" },
    { value: MUSCLE_SUB_GROUPS.CHEST_OUTER, label: "大胸筋外側" },
  ],
  back: [
    { value: MUSCLE_SUB_GROUPS.BACK_OVERALL, label: "背中全体" },
    { value: MUSCLE_SUB_GROUPS.BACK_WIDTH, label: "広背筋（背中の幅）" },
    {
      value: MUSCLE_SUB_GROUPS.BACK_THICKNESS,
      label: "僧帽筋・菱形筋（背中の厚み）",
    },
    {
      value: MUSCLE_SUB_GROUPS.BACK_TRAPS,
      label: "僧帽筋（首の付け根～肩）",
    },
    {
      value: MUSCLE_SUB_GROUPS.BACK_ERECTORS,
      label: "脊柱起立筋（腰～背中下部）",
    },
  ],
  legs: [
    { value: MUSCLE_SUB_GROUPS.LEGS_QUADS, label: "大腿四頭筋（太ももの前側）" },
    {
      value: MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
      label: "ハムストリングス（太ももの後側）",
    },
    { value: MUSCLE_SUB_GROUPS.LEGS_GLUTES, label: "臀筋（お尻）" },
    { value: MUSCLE_SUB_GROUPS.LEGS_CALVES, label: "下腿（ふくらはぎ）" },
    { value: MUSCLE_SUB_GROUPS.LEGS_ADDUCTORS, label: "内転筋（太ももの内側）" },
  ],
  shoulders: [
    { value: MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL, label: "三角筋全体" },
    { value: MUSCLE_SUB_GROUPS.SHOULDERS_FRONT, label: "三角筋前部" },
    { value: MUSCLE_SUB_GROUPS.SHOULDERS_MIDDLE, label: "三角筋中部" },
    { value: MUSCLE_SUB_GROUPS.SHOULDERS_REAR, label: "三角筋後部" },
  ],
  arms: [
    { value: MUSCLE_SUB_GROUPS.ARMS_BICEPS, label: "上腕二頭筋（力こぶ）" },
    {
      value: MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
      label: "上腕三頭筋（二の腕の後ろ）",
    },
    { value: MUSCLE_SUB_GROUPS.ARMS_FOREARMS, label: "前腕筋群（前腕）" },
  ],
  core: [
    { value: MUSCLE_SUB_GROUPS.CORE_RECTUS, label: "腹直筋（お腹の前側）" },
    { value: MUSCLE_SUB_GROUPS.CORE_TRANSVERSE, label: "腹横筋（お腹の深い部分）" },
    { value: MUSCLE_SUB_GROUPS.CORE_OBLIQUES, label: "腹斜筋（お腹の横側）" },
    { value: MUSCLE_SUB_GROUPS.CORE_HIP_FLEXORS, label: "腸腰筋（脚の付け根）" },
  ],
};

export const TARGET_MUSCLE_GROUP_OPTIONS = TARGET_PARTS.flatMap((part) =>
  TARGET_MUSCLE_GROUP_OPTIONS_BY_PART[part].map((option) => ({
    ...option,
    bodyPart: part,
  }))
);

const OVERALL_SUB_GROUP_BY_PART: Partial<
  Record<Exclude<BodyPart, "all">, MuscleSubGroup>
> = {
  chest: MUSCLE_SUB_GROUPS.CHEST_OVERALL,
  back: MUSCLE_SUB_GROUPS.BACK_OVERALL,
  shoulders: MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL,
};

const SUB_GROUP_MAP_BY_PART: Partial<
  Record<Exclude<BodyPart, "all">, Record<string, MuscleSubGroup>>
> = {
  chest: {
    全体: MUSCLE_SUB_GROUPS.CHEST_OVERALL,
    上部: MUSCLE_SUB_GROUPS.CHEST_UPPER,
    大胸筋上部: MUSCLE_SUB_GROUPS.CHEST_UPPER,
    下部: MUSCLE_SUB_GROUPS.CHEST_LOWER,
    大胸筋下部: MUSCLE_SUB_GROUPS.CHEST_LOWER,
    外側: MUSCLE_SUB_GROUPS.CHEST_OUTER,
    大胸筋外側: MUSCLE_SUB_GROUPS.CHEST_OUTER,
  },
  back: {
    全体: MUSCLE_SUB_GROUPS.BACK_OVERALL,
    幅: MUSCLE_SUB_GROUPS.BACK_WIDTH,
    広背筋: MUSCLE_SUB_GROUPS.BACK_WIDTH,
    厚み: MUSCLE_SUB_GROUPS.BACK_THICKNESS,
    "僧帽筋・菱形筋": MUSCLE_SUB_GROUPS.BACK_THICKNESS,
    "僧帽筋・下部": MUSCLE_SUB_GROUPS.BACK_TRAPS,
    僧帽筋: MUSCLE_SUB_GROUPS.BACK_TRAPS,
    脊柱起立筋: MUSCLE_SUB_GROUPS.BACK_ERECTORS,
  },
  legs: {
    大腿四頭筋: MUSCLE_SUB_GROUPS.LEGS_QUADS,
    ハムストリングス: MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
    臀筋: MUSCLE_SUB_GROUPS.LEGS_GLUTES,
    下腿: MUSCLE_SUB_GROUPS.LEGS_CALVES,
    ふくらはぎ: MUSCLE_SUB_GROUPS.LEGS_CALVES,
    内転筋: MUSCLE_SUB_GROUPS.LEGS_ADDUCTORS,
  },
  shoulders: {
    全体: MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL,
    前部: MUSCLE_SUB_GROUPS.SHOULDERS_FRONT,
    三角筋前部: MUSCLE_SUB_GROUPS.SHOULDERS_FRONT,
    中部: MUSCLE_SUB_GROUPS.SHOULDERS_MIDDLE,
    三角筋中部: MUSCLE_SUB_GROUPS.SHOULDERS_MIDDLE,
    後部: MUSCLE_SUB_GROUPS.SHOULDERS_REAR,
    三角筋後部: MUSCLE_SUB_GROUPS.SHOULDERS_REAR,
  },
  arms: {
    上腕二頭筋: MUSCLE_SUB_GROUPS.ARMS_BICEPS,
    上腕三頭筋: MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
    前腕: MUSCLE_SUB_GROUPS.ARMS_FOREARMS,
    前腕筋群: MUSCLE_SUB_GROUPS.ARMS_FOREARMS,
  },
  core: {
    腹直筋: MUSCLE_SUB_GROUPS.CORE_RECTUS,
    腹横筋: MUSCLE_SUB_GROUPS.CORE_TRANSVERSE,
    腹斜筋: MUSCLE_SUB_GROUPS.CORE_OBLIQUES,
    腸腰筋: MUSCLE_SUB_GROUPS.CORE_HIP_FLEXORS,
  },
};

export function resolveSubGroupForBodyPart(
  bodyPart: Exclude<BodyPart, "all">,
  label: string
): MuscleSubGroup | undefined {
  const cleanedLabel = label.replace(/[（(].*?[）)]/g, "").trim();
  return (
    SUB_GROUP_MAP_BY_PART[bodyPart]?.[cleanedLabel] ??
    OVERALL_SUB_GROUP_BY_PART[bodyPart]
  );
}

export function getBodyPartForMuscleSubGroup(
  muscleSubGroup: MuscleSubGroup
): Exclude<BodyPart, "all" | "other"> | undefined {
  return TARGET_MUSCLE_GROUP_OPTIONS.find(
    (option) => option.value === muscleSubGroup
  )?.bodyPart;
}

export function isOverallMuscleSubGroup(
  muscleSubGroup: MuscleSubGroup
): boolean {
  return muscleSubGroup.endsWith("_overall");
}

export function getDefaultTargetMuscleGroups(
  bodyPart: Exclude<BodyPart, "all">
): MuscleSubGroup[] {
  const overallGroup = OVERALL_SUB_GROUP_BY_PART[bodyPart];
  if (overallGroup) return [overallGroup];
  if (bodyPart === "other") return [];

  return TARGET_MUSCLE_GROUP_OPTIONS_BY_PART[bodyPart][0]
    ? [TARGET_MUSCLE_GROUP_OPTIONS_BY_PART[bodyPart][0].value]
    : [];
}

export function getExerciseTargetMuscleGroups(
  exercise: Pick<Exercise, "targetMuscleGroups" | "muscleSubGroup">
): MuscleSubGroup[] {
  if (exercise.targetMuscleGroups?.length) {
    return exercise.targetMuscleGroups;
  }

  return exercise.muscleSubGroup ? [exercise.muscleSubGroup] : [];
}

export function getTargetMuscleGroupLabels(
  targetMuscleGroups: MuscleSubGroup[]
): string[] {
  return targetMuscleGroups.map(
    (muscleSubGroup) => MUSCLE_SUB_GROUP_LABELS[muscleSubGroup] ?? "全体"
  );
}

export function getExerciseTargetMuscleLabels(
  exercise: Pick<Exercise, "targetMuscleGroups" | "muscleSubGroup">
): string[] {
  return getTargetMuscleGroupLabels(getExerciseTargetMuscleGroups(exercise));
}

/**
 * @deprecated bodyPartが必要なため、可能な箇所ではresolveSubGroupForBodyPartを使用する。
 */
export const SUB_GROUP_MAP: Record<string, string> = {
  全体: MUSCLE_SUB_GROUPS.CHEST_OVERALL,
  上部: MUSCLE_SUB_GROUPS.CHEST_UPPER,
  下部: MUSCLE_SUB_GROUPS.CHEST_LOWER,
  外側: MUSCLE_SUB_GROUPS.CHEST_OUTER,
  幅: MUSCLE_SUB_GROUPS.BACK_WIDTH,
  厚み: MUSCLE_SUB_GROUPS.BACK_THICKNESS,
  "僧帽筋・下部": MUSCLE_SUB_GROUPS.BACK_TRAPS,
  大腿四頭筋: MUSCLE_SUB_GROUPS.LEGS_QUADS,
  ハムストリングス: MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
  臀筋: MUSCLE_SUB_GROUPS.LEGS_GLUTES,
  下腿: MUSCLE_SUB_GROUPS.LEGS_CALVES,
  前部: MUSCLE_SUB_GROUPS.SHOULDERS_FRONT,
  中部: MUSCLE_SUB_GROUPS.SHOULDERS_MIDDLE,
  後部: MUSCLE_SUB_GROUPS.SHOULDERS_REAR,
  上腕二頭筋: MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  上腕三頭筋: MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  腹直筋: MUSCLE_SUB_GROUPS.CORE_RECTUS,
  腹横筋: MUSCLE_SUB_GROUPS.CORE_TRANSVERSE,
  腹斜筋: MUSCLE_SUB_GROUPS.CORE_OBLIQUES,
};

/**
 * 機材タイプを判定する関数
 * 種目名から機材タイプを推測
 * @param name 種目名
 * @returns 機材タイプ
 */
export function getEquipmentType(name: string): Exercise["primaryEquipment"] {
  if (name.includes("バーベル") || name.includes("BB")) return "barbell";
  if (name.includes("ダンベル") || name.includes("DB")) return "dumbbell";
  if (
    name.includes("マシン") ||
    name.includes("スミス") ||
    name.includes("チェストプレス") ||
    name.includes("レッグ")
  )
    return "machine";
  if (name.includes("ケーブル") || name.includes("C")) return "cable";
  if (
    name.includes("自重") ||
    name.includes("ディップス") ||
    name.includes("プッシュアップ") ||
    name.includes("プランク") ||
    name.includes("クランチ") ||
    name.includes("レイズ") ||
    name.includes("懸垂") ||
    name.includes("バーピー")
  )
    return "bodyweight";
  if (name.includes("ケトルベル")) return "kettlebell";
  if (
    name.includes("ランニング") ||
    name.includes("バイク") ||
    name.includes("トレッドミル") ||
    name.includes("エアロ") ||
    name.includes("ローイング") ||
    name.includes("ステア") ||
    name.includes("クロス")
  )
    return "machine";
  return "other";
}

/**
 * 英語名のマッピング（日本語名 → 英語名）
 * mock-exercises.ts と seed.ts で共通使用
 */
export const NAME_EN_MAP: Record<string, string> = {
  ベンチプレス: "Bench Press",
  ダンベルプレス: "Dumbbell Press",
  チェストプレス: "Chest Press",
  インクラインダンベルプレス: "Incline Dumbbell Press",
  インクラインベンチプレス: "Incline Bench Press",
  デクラインプレス: "Decline Press",
  デクラインベンチプレス: "Decline Bench Press",
  ディップス: "Dips",
  ダンベルフライ: "Dumbbell Fly",
  ペックフライ: "Pec Fly",
  ケーブルフライ: "Cable Fly",
  ケーブルクロスオーバー: "Cable Crossover",
  プッシュアップ: "Push-up",
  デッドリフト: "Deadlift",
  懸垂: "Chin-up",
  ラットプルダウン: "Lat Pulldown",
  リバースグリップラットプルダウン: "Reverse Grip Lat Pulldown",
  ワイドグリップチンニング: "Wide Grip Chin-up",
  バーベルローイング: "Barbell Row",
  シーテッドロー: "Seated Row",
  ワンハンドローイング: "One Hand Row",
  "T バーローイング": "T-Bar Row",
  ケーブルローイング: "Cable Row",
  ハイパーエクステンション: "Hyperextension",
  シュラッグ: "Shrug",
  フェイスプル: "Face Pull",
  スクワット: "Squat",
  レッグプレス: "Leg Press",
  レッグエクステンション: "Leg Extension",
  ブルガリアンスクワット: "Bulgarian Squat",
  スプリットスクワット: "Split Squat",
  ランジ: "Lunge",
  ステップアップ: "Step-up",
  レッグカール: "Leg Curl",
  ルーマニアンデッドリフト: "Romanian Deadlift",
  ヒップスラスト: "Hip Thrust",
  カーフレイズ: "Calf Raise",
  ダンベルショルダープレス: "Dumbbell Shoulder Press",
  ショルダープレス: "Shoulder Press",
  ミリタリープレス: "Military Press",
  アーノルドプレス: "Arnold Press",
  フロントレイズ: "Front Raise",
  バーベルフロントレイズ: "Barbell Front Raise",
  サイドレイズ: "Side Raise",
  ケーブルラテラルレイズ: "Cable Lateral Raise",
  アップライトロウ: "Upright Row",
  リアデルトフライ: "Rear Delt Fly",
  リバースペックフライ: "Reverse Pec Fly",
  ケーブルリアデルトフライ: "Cable Rear Delt Fly",
  バーベルカール: "Barbell Curl",
  インクラインダンベルカール: "Incline Dumbbell Curl",
  ダンベルハンマーカール: "Dumbbell Hammer Curl",
  トライセプスプッシュダウン: "Triceps Pushdown",
  スカルクラッシャー: "Skull Crusher",
  プリーチャーカール: "Preacher Curl",
  コンセントレーションカール: "Concentration Curl",
  リバースカール: "Reverse Curl",
  ケーブルカール: "Cable Curl",
  ケーブルキックバック: "Cable Kickback",
  ナローベンチプレス: "Close Grip Bench Press",
  オーバーヘッドエクステンション: "Overhead Extension",
  クローズグリッププッシュアップ: "Close Grip Push-up",
  レッグレイズ: "Leg Raise",
  プランク: "Plank",
  ロータリートーソ: "Russian Twist",
  クランチ: "Crunch",
  アブドミナルクランチ: "Abdominal Crunch",
  シットアップベンチ: "Sit-up Bench",
  マウンテンクライマー: "Mountain Climber",
  ハンギングレッグレイズ: "Hanging Leg Raise",
  シットアップ: "Sit-up",
  アブローラー: "Ab Roller",
  サイドプランク: "Side Plank",
  ロシアンツイスト: "Russian Twist",
  バイシクルクランチ: "Bicycle Crunch",
  トレッドミル: "Treadmill",
  ランニング: "Running",
  エアロバイク: "Exercise Bike",
  ローイングマシン: "Rowing Machine",
  ステアクライマー: "Stair Climber",
  クロストレーナー: "Cross Trainer",
  スピンバイク: "Spin Bike",
};
