// API通信用関数
// サーバーアクションとのデータやり取りをここで行う

import {
  saveExercise as saveExerciseAction,
  getExercises as getExercisesAction,
} from "./actions/exercises";
import {
  saveWorkoutSession as saveWorkoutSessionAction,
  getWorkoutSession as getWorkoutSessionAction,
} from "./actions/workout-sessions";
import {
  saveSets as saveSetsAction,
  getSets as getSetsAction,
} from "./actions/sets";
import { getBig3MaxWeights as getBig3MaxWeightsAction } from "./actions/big3-progress";
import type { Exercise, SetRecord } from "@/types/workout";

/**
 * 種目を保存する（カスタム種目）
 */
export async function saveExercise(exercise: Exercise): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise;
}> {
  return await saveExerciseAction(exercise);
}

/**
 * 種目一覧を取得する（共通マスタ + ユーザー独自種目）
 */
export async function getExercises(): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise[];
}> {
  return await getExercisesAction();
}

/**
 * ワークアウトセッションを保存または更新する
 */
export async function saveWorkoutSession({
  date,
  note,
  durationMinutes,
}: {
  date: string; // YYYY-MM-DD形式
  note?: string | null;
  durationMinutes?: number | null;
}): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string; date: string };
}> {
  return await saveWorkoutSessionAction({ date, note, durationMinutes });
}

/**
 * 指定日付のワークアウトセッションを取得する
 */
export async function getWorkoutSession(date: string): Promise<{
  success: boolean;
  error?: string;
  data?: {
    id: string;
    date: string;
    note?: string | null;
    durationMinutes?: number | null;
  };
}> {
  return await getWorkoutSessionAction(date);
}

/**
 * セット記録を保存する
 */
export async function saveSets({
  sessionId,
  exerciseId,
  sets: setsToSave,
}: {
  sessionId: string;
  exerciseId: string;
  sets: SetRecord[];
}): Promise<{
  success: boolean;
  error?: string;
  data?: { count: number };
}> {
  return await saveSetsAction({ sessionId, exerciseId, sets: setsToSave });
}

/**
 * 指定セッション・種目のセット記録を取得する
 */
export async function getSets({
  sessionId,
  exerciseId,
}: {
  sessionId: string;
  exerciseId: string;
}): Promise<{
  success: boolean;
  error?: string;
  data?: SetRecord[];
}> {
  return await getSetsAction({ sessionId, exerciseId });
}

/**
 * Big3種目の最大重量を取得する
 */
export async function getBig3MaxWeights(): Promise<{
  success: boolean;
  error?: string;
  data?: {
    benchPress: { exerciseId: string; maxWeight: number };
    squat: { exerciseId: string; maxWeight: number };
    deadlift: { exerciseId: string; maxWeight: number };
  };
}> {
  return await getBig3MaxWeightsAction();
}
