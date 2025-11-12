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
    console.error("Failed to save exercises to storage:", error);
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
    console.error("Failed to load exercises from storage:", error);
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

export async function loadExercisesWithFallback(): Promise<Exercise[]> {
  const storedExercises = loadExercisesFromStorage();
  if (storedExercises.length > 0) {
    console.log("Storage exercises loaded:", storedExercises.length);
    return storedExercises;
  }

  try {
    const { getExercises } = await import("@/lib/api");
    const result = await getExercises();
    if (result.success && result.data && result.data.length > 0) {
      const exercises = result.data;
      console.log("Database exercises loaded:", exercises.length);
      saveExercisesToStorage(exercises);
      return exercises;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("種目取得エラー:", error);
    }
  }

  console.log("Using mock exercises:", mockInitialExercises.length);
  saveExercisesToStorage(mockInitialExercises);
  return mockInitialExercises;
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

