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
import {
  getSessionDetails as getSessionDetailsAction,
  getBodyPartsByDateRange as getBodyPartsByDateRangeAction,
} from "./actions/history";
import {
  deleteExerciseSets as deleteExerciseSetsAction,
  deleteCardioRecords as deleteCardioRecordsAction,
} from "./actions/delete-exercise";
import type {
  Exercise,
  SetRecord,
  CardioRecord,
  BodyPart,
} from "@/types/workout";

/**
 * 種目を保存する（カスタム種目）
 * @param userId ユーザーID
 * @param exercise 種目データ
 */
export async function saveExercise(
  userId: string,
  exercise: Exercise
): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise;
}> {
  return await saveExerciseAction(userId, exercise);
}

/**
 * 種目一覧を取得する（共通マスタ + ユーザー独自種目）
 * @param userId ユーザーID（nullの場合はゲスト）
 */
export async function getExercises(userId: string | null): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise[];
}> {
  return await getExercisesAction(userId);
}

/**
 * ワークアウトセッションを保存または更新する
 * @param userId ユーザーID
 */
export async function saveWorkoutSession(
  userId: string,
  {
    date,
    note,
    durationMinutes,
  }: {
    date: string; // YYYY-MM-DD形式
    note?: string | null;
    durationMinutes?: number | null;
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string; date: string };
}> {
  return await saveWorkoutSessionAction(userId, {
    date,
    note,
    durationMinutes,
  });
}

/**
 * 指定日付のワークアウトセッションを取得する
 * @param userId ユーザーID
 */
export async function getWorkoutSession(
  userId: string,
  date: string
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    id: string;
    date: string;
    note?: string | null;
    durationMinutes?: number | null;
  };
}> {
  return await getWorkoutSessionAction(userId, date);
}

/**
 * セット記録を保存する
 * @param userId ユーザーID
 */
export async function saveSets(
  userId: string,
  {
    sessionId,
    exerciseId,
    sets: setsToSave,
  }: {
    sessionId: string;
    exerciseId: string;
    sets: SetRecord[];
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: { count: number };
}> {
  return await saveSetsAction(userId, {
    sessionId,
    exerciseId,
    sets: setsToSave,
  });
}

/**
 * 指定セッション・種目のセット記録を取得する
 * @param userId ユーザーID
 */
export async function getSets(
  userId: string,
  {
    sessionId,
    exerciseId,
  }: {
    sessionId: string;
    exerciseId: string;
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: SetRecord[];
}> {
  return await getSetsAction(userId, { sessionId, exerciseId });
}

/**
 * 有酸素種目の記録を保存する
 * @param userId ユーザーID
 */
export async function saveCardioRecords(
  userId: string,
  {
    sessionId,
    exerciseId,
    records: recordsToSave,
  }: {
    sessionId: string;
    exerciseId: string;
    records: CardioRecord[];
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: { count: number };
}> {
  return await saveCardioRecordsAction(userId, {
    sessionId,
    exerciseId,
    records: recordsToSave,
  });
}

/**
 * 指定セッション・種目の有酸素記録を取得する
 * @param userId ユーザーID
 */
export async function getCardioRecords(
  userId: string,
  {
    sessionId,
    exerciseId,
  }: {
    sessionId: string;
    exerciseId: string;
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: CardioRecord[];
}> {
  return await getCardioRecordsAction(userId, { sessionId, exerciseId });
}

/**
 * セッションIDでそのセッションの全種目とセット記録を取得する
 * @param userId ユーザーID
 */
export async function getSessionDetails(
  userId: string,
  sessionId: string
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    workoutExercises: Array<{
      exerciseId: string;
      sets: SetRecord[];
    }>;
    cardioExercises: Array<{
      exerciseId: string;
      records: CardioRecord[];
    }>;
  };
}> {
  return await getSessionDetailsAction(userId, sessionId);
}

/**
 * 日付範囲で日付ごとの部位一覧を取得する（カレンダー色付け用）
 * @param userId ユーザーID
 */
export async function getBodyPartsByDateRange(
  userId: string,
  {
    startDate,
    endDate,
  }: {
    startDate: string; // YYYY-MM-DD形式
    endDate: string; // YYYY-MM-DD形式
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: Record<string, BodyPart[]>; // 日付文字列をキー、部位配列を値
}> {
  return await getBodyPartsByDateRangeAction(userId, { startDate, endDate });
}

/**
 * 指定セッション・種目のセット記録を削除する
 * @param userId ユーザーID
 */
export async function deleteExerciseSets(
  userId: string,
  {
    sessionId,
    exerciseId,
  }: {
    sessionId: string;
    exerciseId: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  return await deleteExerciseSetsAction(userId, { sessionId, exerciseId });
}

/**
 * 指定セッション・種目の有酸素記録を削除する
 * @param userId ユーザーID
 */
export async function deleteCardioRecords(
  userId: string,
  {
    sessionId,
    exerciseId,
  }: {
    sessionId: string;
    exerciseId: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  return await deleteCardioRecordsAction(userId, { sessionId, exerciseId });
}
