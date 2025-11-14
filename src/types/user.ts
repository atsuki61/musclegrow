// ユーザー関連の型定義

export type User = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Profile = {
  id: string;
  userId: string;
  height?: number; // cm
  weight?: number; // kg
  bodyFat?: number; // %
  muscleMass?: number; // kg
  createdAt: Date;
  updatedAt: Date;
};

export type Goal = {
  id: string;
  userId: string;
  exercise: string;
  targetWeight: number;
  currentWeight: number;
  deadline?: Date;
  achieved: boolean;
  createdAt: Date;
  updatedAt: Date;
};
