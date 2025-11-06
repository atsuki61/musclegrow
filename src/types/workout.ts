// トレーニング関連の型定義

/**
 * トレーニング部位の型定義
 * UI用の"all"と"other"を含む
 */
export type BodyPart =
  | "all"
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "other";

/**
 * 機材タイプ
 */
export type EquipmentType =
  | "barbell" // バーベル
  | "dumbbell" // ダンベル
  | "machine" // マシン
  | "cable" // ケーブル
  | "bodyweight" // 自重
  | "kettlebell" // ケトルベル
  | "other"; // その他

/**
 * 部位内サブ分類（目的別）
 */
export type MuscleSubGroup =
  // 胸
  | "chest_overall" // 大胸筋全体
  | "chest_upper" // 大胸筋上部
  | "chest_lower" // 大胸筋下部
  | "chest_outer" // 大胸筋外側
  // 背中
  | "back_overall" // 広背筋全体
  | "back_width" // 広背筋幅
  | "back_thickness" // 広背筋厚み
  | "back_traps" // 僧帽筋・下部
  // 脚
  | "legs_quads" // 大腿四頭筋
  | "legs_hamstrings" // ハムストリングス
  | "legs_glutes" // 臀筋
  | "legs_calves" // 下腿
  // 肩
  | "shoulders_overall" // 三角筋全体
  | "shoulders_front" // 三角筋前部
  | "shoulders_middle" // 三角筋中部
  | "shoulders_rear" // 三角筋後部
  // 腕
  | "arms_biceps" // 上腕二頭筋
  | "arms_triceps" // 上腕三頭筋
  // 腹筋
  | "core_rectus" // 腹直筋
  | "core_transverse" // 腹横筋
  | "core_obliques"; // 腹斜筋

/**
 * 種目の表示階層
 */
export type ExerciseTier = "initial" | "selectable" | "custom";

export type Workout = {
  id: string;
  userId: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkoutSession = {
  id: string;
  userId: string;
  date: Date;
  workouts: Workout[];
  totalVolume: number;
  duration?: number; // 分単位
  memo?: string;
};

export type Exercise = {
  id: string;
  name: string;
  nameEn?: string;
  bodyPart: Exclude<BodyPart, "all" | "other">; // データベース用の値のみ（UI用の"all"と"other"は除外）
  muscleSubGroup?: MuscleSubGroup;
  primaryEquipment?: EquipmentType;
  tier: ExerciseTier;
  isBig3: boolean;
  description?: string;
  videoUrl?: string;
  difficultyLevel?: "beginner" | "intermediate" | "advanced";
  equipmentRequired?: string[];
  userId?: string;
  createdAt?: Date;
};

