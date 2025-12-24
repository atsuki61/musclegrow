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
  | "core" //腹筋
  | "other"; //その他

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

export type Exercise = {
  id: string;
  name: string;
  nameEn?: string;
  bodyPart: Exclude<BodyPart, "all">; // データベース用の値（UI用の"all"は除外、"other"は含む）
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

/**
 * セット記録（入力用）
 * モーダル内で入力・編集する際に使用
 */
export type SetRecord = {
  id: string; // 一時的なID（nanoidなど）
  setOrder: number; // セット順（1, 2, 3...）
  weight?: number; // 重量（kg）- 自重種目や時間ベース種目ではオプショナル
  reps: number; // 回数
  duration?: number | null; // 時間ベース種目用（秒）- プランクなど
  rpe?: number | null; // 主観的疲労度（RPE: 1-10）
  isWarmup?: boolean; // ウォームアップセットか
  restSeconds?: number | null; // セット間の休憩時間（秒）
  notes?: string | null; // セットごとのメモ
  failure?: boolean; // 限界まで追い込んだか
};

/**
 * 有酸素種目の記録（入力用）
 * モーダル内で入力・編集する際に使用
 */
export type CardioRecord = {
  id: string; // 一時的なID（nanoidなど）
  duration: number; // 時間（分）
  distance?: number | null; // 距離（km）
  speed?: number | null; // 速度（km/h）- 距離と時間から自動計算可能
  calories?: number | null; // 消費カロリー（kcal）
  heartRate?: number | null; // 心拍数（bpm）
  incline?: number | null; // 傾斜（%）- トレッドミル用
  notes?: string | null; // メモ
  date: Date; // 記録日時
};
