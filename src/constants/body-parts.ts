/**
 * トレーニング部位のID定義
 */
export const BODY_PARTS = {
  ALL: "all",
  CHEST: "chest",
  BACK: "back",
  LEGS: "legs",
  SHOULDERS: "shoulders",
  ARMS: "arms",
  CORE: "core",
  OTHER: "other",
} as const;

export type BodyPartValue = (typeof BODY_PARTS)[keyof typeof BODY_PARTS];

/**
 * 部位名のラベル定義
 */
export const BODY_PART_LABELS: Record<BodyPartValue, string> = {
  [BODY_PARTS.ALL]: "全て",
  [BODY_PARTS.CHEST]: "胸",
  [BODY_PARTS.BACK]: "背中",
  [BODY_PARTS.LEGS]: "脚",
  [BODY_PARTS.SHOULDERS]: "肩",
  [BODY_PARTS.ARMS]: "腕",
  [BODY_PARTS.CORE]: "腹筋",
  [BODY_PARTS.OTHER]: "その他",
};

/**
 * 部位内サブ分類（目的別）のID定義
 */
export const MUSCLE_SUB_GROUPS = {
  // 胸
  CHEST_OVERALL: "chest_overall",
  CHEST_UPPER: "chest_upper",
  CHEST_LOWER: "chest_lower",
  CHEST_OUTER: "chest_outer",
  // 背中
  BACK_OVERALL: "back_overall",
  BACK_WIDTH: "back_width",
  BACK_THICKNESS: "back_thickness",
  BACK_TRAPS: "back_traps",
  // 脚
  LEGS_QUADS: "legs_quads",
  LEGS_HAMSTRINGS: "legs_hamstrings",
  LEGS_GLUTES: "legs_glutes",
  LEGS_CALVES: "legs_calves",
  // 肩
  SHOULDERS_OVERALL: "shoulders_overall",
  SHOULDERS_FRONT: "shoulders_front",
  SHOULDERS_MIDDLE: "shoulders_middle",
  SHOULDERS_REAR: "shoulders_rear",
  // 腕
  ARMS_BICEPS: "arms_biceps",
  ARMS_TRICEPS: "arms_triceps",
  // 腹筋
  CORE_RECTUS: "core_rectus",
  CORE_TRANSVERSE: "core_transverse",
  CORE_OBLIQUES: "core_obliques",
} as const;

export type MuscleSubGroupValue =
  (typeof MUSCLE_SUB_GROUPS)[keyof typeof MUSCLE_SUB_GROUPS];

/**
 * サブ分類のラベル定義
 */
export const MUSCLE_SUB_GROUP_LABELS: Record<MuscleSubGroupValue, string> = {
  // 胸
  [MUSCLE_SUB_GROUPS.CHEST_OVERALL]: "全体",
  [MUSCLE_SUB_GROUPS.CHEST_UPPER]: "上部",
  [MUSCLE_SUB_GROUPS.CHEST_LOWER]: "下部",
  [MUSCLE_SUB_GROUPS.CHEST_OUTER]: "外側",
  // 背中
  [MUSCLE_SUB_GROUPS.BACK_OVERALL]: "全体",
  [MUSCLE_SUB_GROUPS.BACK_WIDTH]: "幅",
  [MUSCLE_SUB_GROUPS.BACK_THICKNESS]: "厚み",
  [MUSCLE_SUB_GROUPS.BACK_TRAPS]: "僧帽筋・下部（首の付け根～肩）",
  // 脚
  [MUSCLE_SUB_GROUPS.LEGS_QUADS]: "大腿四頭筋（太ももの前側）",
  [MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS]: "ハムストリングス（太ももの後側）",
  [MUSCLE_SUB_GROUPS.LEGS_GLUTES]: "臀筋（お尻）",
  [MUSCLE_SUB_GROUPS.LEGS_CALVES]: "下腿（ふくらはぎ）",
  // 肩
  [MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL]: "全体",
  [MUSCLE_SUB_GROUPS.SHOULDERS_FRONT]: "前部",
  [MUSCLE_SUB_GROUPS.SHOULDERS_MIDDLE]: "中部",
  [MUSCLE_SUB_GROUPS.SHOULDERS_REAR]: "後部",
  // 腕
  [MUSCLE_SUB_GROUPS.ARMS_BICEPS]: "上腕二頭筋（力こぶ）",
  [MUSCLE_SUB_GROUPS.ARMS_TRICEPS]: "上腕三頭筋（二の腕の後ろ）",
  // 腹筋
  [MUSCLE_SUB_GROUPS.CORE_RECTUS]: "腹直筋（お腹の前側）",
  [MUSCLE_SUB_GROUPS.CORE_TRANSVERSE]: "腹横筋（お腹の深い部分）",
  [MUSCLE_SUB_GROUPS.CORE_OBLIQUES]: "腹斜筋（お腹の横側）",
};

/**
 * 部位別の色定義（Tailwind CSSクラス）
 */
export const BODY_PART_COLORS: Record<BodyPartValue, string> = {
  [BODY_PARTS.ALL]: "bg-gray-100",
  [BODY_PARTS.CHEST]: "bg-red-500",
  [BODY_PARTS.BACK]: "bg-blue-500",
  [BODY_PARTS.LEGS]: "bg-green-500",
  [BODY_PARTS.SHOULDERS]: "bg-yellow-500",
  [BODY_PARTS.ARMS]: "bg-purple-500",
  [BODY_PARTS.CORE]: "bg-orange-500",
  [BODY_PARTS.OTHER]: "bg-gray-500",
};

/**
 * 部位別の色定義（HEX値）
 * カレンダーの描画に使用
 */
export const BODY_PART_COLOR_HEX: Record<
  Exclude<BodyPartValue, typeof BODY_PARTS.ALL>,
  string
> = {
  [BODY_PARTS.CHEST]: "#ef4444",
  [BODY_PARTS.BACK]: "#3b82f6",
  [BODY_PARTS.LEGS]: "#22c55e",
  [BODY_PARTS.SHOULDERS]: "#eab308",
  [BODY_PARTS.ARMS]: "#a855f7",
  [BODY_PARTS.CORE]: "#f97316",
  [BODY_PARTS.OTHER]: "#6b7280",
};

