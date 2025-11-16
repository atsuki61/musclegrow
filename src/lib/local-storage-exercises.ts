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
 * ローカルストレージに種目を追加
 */
export function addExerciseToStorage(exercise: Exercise): void {
  const exercises = loadExercisesFromStorage();

  // 既存の種目を更新（IDが同じ場合）
  const existingIndex = exercises.findIndex((e) => e.id === exercise.id);
  if (existingIndex !== -1) {
    exercises[existingIndex] = exercise;
  } else {
    exercises.push(exercise);
  }

  saveExercisesToStorage(exercises);
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
async function loadExercisesFromDatabase(): Promise<Exercise[] | null> {
  try {
    const { getExercises } = await import("@/lib/api");
    const result = await getExercises();

    if (result.success && result.data && result.data.length > 0) {
      const exercises = result.data;

      if (hasInitialExercises(exercises)) {
        console.log(
          `データベースから種目を読み込みました: ${exercises.length}件`
        );
        saveExercisesToStorage(exercises);
        return exercises;
      }

      // tier="initial"の種目がない場合は警告
      if (process.env.NODE_ENV === "development") {
        console.warn(
          'データベースから取得した種目にtier="initial"の種目が存在しません。モックデータを使用します。'
        );
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("種目取得エラー:", error);
    }
  }

  return null;
}

export async function loadExercisesWithFallback(): Promise<Exercise[]> {
  // 1. まずデータベースから取得を試みる（認証済みユーザーではDBを正とする）
  const databaseExercises = await loadExercisesFromDatabase();
  if (databaseExercises && databaseExercises.length > 0) {
    return databaseExercises;
  }

  // 2. データベースから取得できなかった場合、ローカルストレージから取得
  const storedExercises = loadExercisesFromStorage();

  if (storedExercises.length > 0) {
    // tier="initial"の種目が存在する場合は、そのまま使用
    if (hasInitialExercises(storedExercises)) {
      console.log(
        `ローカルストレージから種目を読み込みました: ${storedExercises.length}件`
      );
      return storedExercises;
    }

    // tier="initial"の種目が存在しない場合は、開発時のみ警告を出してモックにフォールバック
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `ローカルストレージにtier="initial"の種目が存在しません（${storedExercises.length}件の種目があります）。モックデータを使用します。`
      );
    }
  }

  // 3. フォールバック: モックデータを使用（ゲスト利用時など）
  return loadMockExercises();
}

/**
 * 種目IDから種目情報を取得（propsのexercisesとローカルストレージの両方を検索）
 */
export function getExerciseById(
  exerciseId: string,
  exercises: Exercise[]
): Exercise | undefined {
  // まずpropsのexercisesから検索
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (exercise) return exercise;

  // propsになければローカルストレージから検索
  const storedExercises = loadExercisesFromStorage();
  return storedExercises.find((e) => e.id === exerciseId);
}
