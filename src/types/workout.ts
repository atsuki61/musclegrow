// トレーニング関連の型定義

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
  bodyPart: "chest" | "back" | "legs" | "shoulders" | "arms" | "abs";
  isBig3: boolean;
  description?: string;
};

