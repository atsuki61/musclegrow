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
import {
  saveCardioRecords as saveCardioRecordsAction,
  getCardioRecords as getCardioRecordsAction,
} from "./actions/cardio-records";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";

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
 * 有酸素種目の記録を保存する
 */
export async function saveCardioRecords({
  sessionId,
  exerciseId,
  records: recordsToSave,
}: {
  sessionId: string;
  exerciseId: string;
  records: CardioRecord[];
}): Promise<{
  success: boolean;
  error?: string;
  data?: { count: number };
}> {
  return await saveCardioRecordsAction({
    sessionId,
    exerciseId,
    records: recordsToSave,
  });
}

/**
 * 指定セッション・種目の有酸素記録を取得する
 */
export async function getCardioRecords({
  sessionId,
  exerciseId,
}: {
  sessionId: string;
  exerciseId: string;
}): Promise<{
  success: boolean;
  error?: string;
  data?: CardioRecord[];
}> {
  return await getCardioRecordsAction({ sessionId, exerciseId });
}
