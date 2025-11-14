/**
 * グラフ機能用の型定義
 */

// プロフィール履歴データ
export type ProfileHistoryData = {
  id: string;
  userId: string;
  height: number | null;
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  bmi: number | null;
  recordedAt: string; // ISO 8601形式
};

// 種目推移データ（重量のみ）
export type ExerciseProgressData = {
  date: string; // YYYY-MM-DD
  maxWeight: number; // 最大重量（kg）
};

// Big3推移データ
export type Big3ProgressData = {
  benchPress: ExerciseProgressData[];
  squat: ExerciseProgressData[];
  deadlift: ExerciseProgressData[];
};

// 期間プリセット
export type DateRangePreset =
  | "week"
  | "month"
  | "3months"
  | "6months"
  | "year"
  | "all";

// プロフィールグラフタイプ
export type ProfileChartType = "weight" | "bodyFat" | "muscleMass" | "bmi";
