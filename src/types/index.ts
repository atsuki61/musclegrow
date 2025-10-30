// Common types
export type User = {
  id: string;
  email: string;
  name?: string;
};

export type Workout = {
  id: string;
  userId: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  date: Date;
};
