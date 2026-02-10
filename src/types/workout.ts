// トレーニング関連の型定義

/**
 * トレーニング部位の型定義
 * UI用の"all"と"other"を含む
 */
import {
  type BodyPartValue,
  type MuscleSubGroupValue,
} from "@/constants/body-parts";

/**
 * トレーニング部位の型定義
 * UI用の"all"と"other"を含む
 */
export type BodyPart = BodyPartValue;

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
export type MuscleSubGroup = MuscleSubGroupValue;

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
  tier: ExerciseTier;//不要かも？
  isBig3: boolean;
  description?: string;
  videoUrl?: string;
  difficultyLevel?: "beginner" | "intermediate" | "advanced";//不要かも？
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
  isPersonalRecord?: boolean; // 最高記録として記録するか
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
