import type { Exercise } from "@/types/workout";

// サブ分類のマッピング（seed.tsと同じ）
const SUB_GROUP_MAP: Record<string, string> = {
  全体: "chest_overall",
  上部: "chest_upper",
  下部: "chest_lower",
  外側: "chest_outer",
  幅: "back_width",
  厚み: "back_thickness",
  "僧帽筋・下部": "back_traps",
  大腿四頭筋: "legs_quads",
  ハムストリングス: "legs_hamstrings",
  臀筋: "legs_glutes",
  下腿: "legs_calves",
  前部: "shoulders_front",
  中部: "shoulders_middle",
  後部: "shoulders_rear",
  上腕二頭筋: "arms_biceps",
  上腕三頭筋: "arms_triceps",
  腹直筋: "core_rectus",
  腹横筋: "core_transverse",
  腹斜筋: "core_obliques",
};

// 機材タイプのマッピング（seed.tsと同じ）
function getEquipmentType(name: string): string {
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

// 英語名のマッピング（seed.tsと同じ）
const NAME_EN_MAP: Record<string, string> = {
  ベンチプレス: "Bench Press",
  ダンベルプレス: "Dumbbell Press",
  チェストプレス: "Chest Press",
  インクラインダンベルプレス: "Incline Dumbbell Press",
  デクラインプレス: "Decline Press",
  ディップス: "Dips",
  ダンベルフライ: "Dumbbell Fly",
  ペックフライ: "Pec Fly",
  デッドリフト: "Deadlift",
  懸垂: "Chin-up",
  ラットプルダウン: "Lat Pulldown",
  シーテッドロー: "Seated Row",
  ワンハンドローイング: "One Hand Row",
  スクワット: "Squat",
  レッグプレス: "Leg Press",
  レッグエクステンション: "Leg Extension",
  ブルガリアンスクワット: "Bulgarian Squat",
  レッグカール: "Leg Curl",
  ダンベルショルダープレス: "Dumbbell Shoulder Press",
  "ショルダープレス（スミス）": "Smith Machine Shoulder Press",
  サイドレイズ: "Side Raise",
  リアデルトフライ: "Rear Delt Fly",
  バーベルカール: "Barbell Curl",
  インクラインダンベルカール: "Incline Dumbbell Curl",
  ダンベルハンマーカール: "Dumbbell Hammer Curl",
  トライセプスプッシュダウン: "Triceps Pushdown",
  スカルクラッシャー: "Skull Crusher",
  レッグレイズ: "Leg Raise",
  プランク: "Plank",
  ロータリートーソ: "Russian Twist",
  "ランニング（トレッドミル／屋外）": "Running",
  "エアロバイク（バイク）": "Exercise Bike",
};

// tier: "initial" の種目定義（種目.mdの星マーク）
const initialExercises = [
  // === 胸 ===
  {
    name: "ベンチプレス",
    bodyPart: "chest",
    subGroup: "全体",
    tier: "initial",
    isBig3: true,
  },
  {
    name: "ダンベルプレス",
    bodyPart: "chest",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "チェストプレス",
    bodyPart: "chest",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "インクラインダンベルプレス",
    bodyPart: "chest",
    subGroup: "上部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "デクラインプレス",
    bodyPart: "chest",
    subGroup: "下部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ディップス",
    bodyPart: "chest",
    subGroup: "下部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ダンベルフライ",
    bodyPart: "chest",
    subGroup: "外側",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ペックフライ",
    bodyPart: "chest",
    subGroup: "外側",
    tier: "initial",
    isBig3: false,
  },
  // === 背中 ===
  {
    name: "デッドリフト",
    bodyPart: "back",
    subGroup: "全体",
    tier: "initial",
    isBig3: true,
  },
  {
    name: "懸垂",
    bodyPart: "back",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ラットプルダウン",
    bodyPart: "back",
    subGroup: "幅",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "シーテッドロー",
    bodyPart: "back",
    subGroup: "厚み",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ワンハンドローイング",
    bodyPart: "back",
    subGroup: "厚み",
    tier: "initial",
    isBig3: false,
  },
  // === 脚 ===
  {
    name: "スクワット",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: true,
  },
  {
    name: "レッグプレス",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "レッグエクステンション",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ブルガリアンスクワット",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "レッグカール",
    bodyPart: "legs",
    subGroup: "ハムストリングス",
    tier: "initial",
    isBig3: false,
  },
  // === 肩 ===
  {
    name: "ダンベルショルダープレス",
    bodyPart: "shoulders",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ショルダープレス（スミス）",
    bodyPart: "shoulders",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "サイドレイズ",
    bodyPart: "shoulders",
    subGroup: "中部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "リアデルトフライ",
    bodyPart: "shoulders",
    subGroup: "後部",
    tier: "initial",
    isBig3: false,
  },
  // === 腕 ===
  {
    name: "バーベルカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "インクラインダンベルカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ダンベルハンマーカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "トライセプスプッシュダウン",
    bodyPart: "arms",
    subGroup: "上腕三頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "スカルクラッシャー",
    bodyPart: "arms",
    subGroup: "上腕三頭筋",
    tier: "initial",
    isBig3: false,
  },
  // === 腹筋 ===
  {
    name: "レッグレイズ",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "プランク",
    bodyPart: "core",
    subGroup: "腹横筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ロータリートーソ",
    bodyPart: "core",
    subGroup: "腹斜筋",
    tier: "initial",
    isBig3: false,
  },
  // === その他 ===
  {
    name: "ランニング（トレッドミル／屋外）",
    bodyPart: "other",
    subGroup: "有酸素",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "エアロバイク（バイク）",
    bodyPart: "other",
    subGroup: "有酸素",
    tier: "initial",
    isBig3: false,
  },
];

// ダミーデータを生成（Exercise型に変換）
export const mockInitialExercises: Exercise[] = initialExercises.map(
  (exercise, index) => {
    const subGroup = SUB_GROUP_MAP[exercise.subGroup] || undefined;
    const equipment = getEquipmentType(
      exercise.name
    ) as Exercise["primaryEquipment"];

    return {
      id: `mock-${index + 1}`,
      name: exercise.name,
      nameEn: NAME_EN_MAP[exercise.name],
      bodyPart: exercise.bodyPart as Exercise["bodyPart"],
      muscleSubGroup: subGroup as Exercise["muscleSubGroup"],
      primaryEquipment: equipment,
      tier: exercise.tier as Exercise["tier"],
      isBig3: exercise.isBig3,
    };
  }
);
