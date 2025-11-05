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
  nameEn: string;
  bodyPart: Exclude<BodyPart, "all" | "other">; // データベース用の値のみ（UI用の"all"と"other"は除外）
  isBig3: boolean;
  description?: string;
};

