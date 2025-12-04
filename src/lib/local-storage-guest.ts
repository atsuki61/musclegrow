"use client";

import type { Exercise } from "@/types/workout";

const GUEST_SETTINGS_KEY = "musclegrow_guest_settings";
const GUEST_CUSTOM_EXERCISES_KEY = "musclegrow_guest_custom_exercises";

type GuestSettings = Record<string, boolean>; // exerciseId: isVisible

/**
 * ゲストユーザーの種目リストを取得する
 * (サーバーからの基本リスト + ローカルのカスタム種目 + ローカルの表示設定)
 */
export function getGuestExercises(baseExercises: Exercise[]): Exercise[] {
  if (typeof window === "undefined") return baseExercises;

  try {
    // 1. 設定（表示/非表示）の読み込み
    const settingsRaw = localStorage.getItem(GUEST_SETTINGS_KEY);
    const settings: GuestSettings = settingsRaw ? JSON.parse(settingsRaw) : {};

    // 2. カスタム種目の読み込み
    const customRaw = localStorage.getItem(GUEST_CUSTOM_EXERCISES_KEY);
    const customExercises: Exercise[] = customRaw ? JSON.parse(customRaw) : [];

    // 3. 基本リストとカスタム種目をマージ
    const allExercises = [...baseExercises, ...customExercises];

    // 4. 設定を適用してtierを更新
    return allExercises.map((ex) => {
      const isVisible = settings[ex.id];

      // 設定がある場合はそれを優先
      if (isVisible !== undefined) {
        return {
          ...ex,
          tier: isVisible ? "initial" : "selectable",
        };
      }

      // 設定がない場合
      // カスタム種目はデフォルトで表示(initial)
      if (customExercises.some((c) => c.id === ex.id)) {
        return { ...ex, tier: "initial" };
      }

      // それ以外は元のtierを維持
      return ex;
    });
  } catch (error) {
    console.error("ゲストデータの読み込みに失敗しました:", error);
    return baseExercises;
  }
}

/**
 * ゲストユーザーの種目表示/非表示を保存
 */
export function toggleGuestExerciseVisibility(
  exerciseId: string,
  isVisible: boolean
): void {
  if (typeof window === "undefined") return;

  try {
    const settingsRaw = localStorage.getItem(GUEST_SETTINGS_KEY);
    const settings: GuestSettings = settingsRaw ? JSON.parse(settingsRaw) : {};

    settings[exerciseId] = isVisible;

    localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("ゲスト設定の保存に失敗しました:", error);
  }
}

/**
 * ゲストユーザーのカスタム種目を保存
 */
export function saveGuestCustomExercise(exercise: Exercise): void {
  if (typeof window === "undefined") return;

  try {
    const customRaw = localStorage.getItem(GUEST_CUSTOM_EXERCISES_KEY);
    const customExercises: Exercise[] = customRaw ? JSON.parse(customRaw) : [];

    // 重複チェック（念のため）
    const exists = customExercises.some((e) => e.id === exercise.id);
    if (!exists) {
      customExercises.push(exercise);
      localStorage.setItem(
        GUEST_CUSTOM_EXERCISES_KEY,
        JSON.stringify(customExercises)
      );
    }
  } catch (error) {
    console.error("カスタム種目の保存に失敗しました:", error);
  }
}
