export interface ProfileResponse {
  id: string;
  userId: string;
  height: number | null;
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  big3TargetBenchPress: number | null;
  big3TargetSquat: number | null;
  big3TargetDeadlift: number | null;
  createdAt: string;
  updatedAt: string;
}

