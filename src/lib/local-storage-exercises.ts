"use client";

import type { Exercise } from "@/types/workout";
import { mockInitialExercises } from "./mock-exercises";

const EXERCISES_STORAGE_KEY = "exercises";

/**
 * ローカルストレージに種目一覧を保存
 */
export function saveExercisesToStorage(exercises: Exercise[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises));
  } catch (error) {
    console.error("種目の保存に失敗しました:", error);
  }
}

export function loadExercisesFromStorage(): Exercise[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(EXERCISES_STORAGE_KEY);
    if (!stored) return [];

    const exercises = JSON.parse(stored) as Exercise[];

    if (Array.isArray(exercises) && exercises.length === 0) {
      localStorage.removeItem(EXERCISES_STORAGE_KEY);
      return [];
    }

    return exercises;
  } catch (error) {
    console.error("種目の読み込みに失敗しました:", error);
    localStorage.removeItem(EXERCISES_STORAGE_KEY);
    return [];
  }
}

/**
 * ローカルストレージに種目を追加（tierをinitialに更新）
 */
export function addExerciseToStorage(exercise: Exercise): void {
  const exercises = loadExercisesFromStorage();

  // 既存の種目を更新（IDが同じ場合）
  const existingIndex = exercises.findIndex((e) => e.id === exercise.id);
  if (existingIndex !== -1) {
    // 既存データがある場合は上書き（tier: initial になる）
    exercises[existingIndex] = { ...exercise, tier: "initial" };
  } else {
    // 新規追加
    exercises.push({ ...exercise, tier: "initial" });
  }

  saveExercisesToStorage(exercises);
}

/**
 * ▼ 追加: ローカルストレージから種目を「削除」（tierをselectableに戻す）
 */
export function removeExerciseFromStorage(exerciseId: string): void {
  const exercises = loadExercisesFromStorage();

  const index = exercises.findIndex((e) => e.id === exerciseId);
  if (index !== -1) {
    // 削除せず、tierを 'selectable' に変更してリストから隠す
    exercises[index] = { ...exercises[index], tier: "selectable" };
    saveExercisesToStorage(exercises);
  }
}

/**
 * tier="initial"の種目が存在するか確認
 */
function hasInitialExercises(exercises: Exercise[]): boolean {
  return exercises.some((e) => e.tier === "initial");
}

/**
 * モックデータを使用してローカルストレージに保存
 */
function loadMockExercises(): Exercise[] {
  console.log(`モックデータを使用します: ${mockInitialExercises.length}件`);
  saveExercisesToStorage(mockInitialExercises);
  return mockInitialExercises;
}

/**
 * データベースから種目を取得して検証
 */
async function loadExercisesFromDatabase(
  userId: string | null
): Promise<Exercise[] | null> {
  try {
    const { getExercises } = await import("@/lib/api");
    const result = await getExercises(userId);

    if (result.success && result.data && result.data.length > 0) {
      return result.data;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("種目取得エラー:", error);
    }
  }

  return null;
}

/**
 * サーバーデータとローカルデータをマージするヘルパー関数
 */
function mergeExercises(
  serverExercises: Exercise[],
  localExercises: Exercise[]
): Exercise[] {
  const merged = serverExercises.map((serverEx) => {
    const localEx = localExercises.find((e) => e.id === serverEx.id);

    // ローカルでの変更（tierの変更など）があればそれを優先
    if (localEx) {
      return localEx;
    }
    return serverEx;
  });

  // サーバーにないがローカルにある種目（カスタム種目など）を追加
  const serverIds = new Set(serverExercises.map((e) => e.id));
  const localOnly = localExercises.filter((e) => !serverIds.has(e.id));

  return [...merged, ...localOnly];
}

export async function loadExercisesWithFallback(
  initialExercises?: Exercise[],
  userId?: string | null
): Promise<Exercise[]> {
  // 1. ローカルストレージから現在の状態を取得
  const storedExercises = loadExercisesFromStorage();

  // 2. サーバー初期データがある場合
  if (initialExercises && initialExercises.length > 0) {
    const mergedExercises = mergeExercises(initialExercises, storedExercises);
    saveExercisesToStorage(mergedExercises);
    return mergedExercises;
  }

  // 3. DBから取得を試みる
  const databaseExercises = await loadExercisesFromDatabase(userId ?? null);
  if (databaseExercises && databaseExercises.length > 0) {
    const mergedExercises = mergeExercises(databaseExercises, storedExercises);
    saveExercisesToStorage(mergedExercises);
    return mergedExercises;
  }

  // 4. ローカルストレージのみ
  if (storedExercises.length > 0) {
    if (hasInitialExercises(storedExercises)) {
      return storedExercises;
    }
  }

  // 5. フォールバック
  return loadMockExercises();
}

export function getExerciseById(
  exerciseId: string,
  exercises: Exercise[]
): Exercise | undefined {
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (exercise) return exercise;

  const storedExercises = loadExercisesFromStorage();
  return storedExercises.find((e) => e.id === exerciseId);
}
