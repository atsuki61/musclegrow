"use client";

import type { SetRecord } from "@/types/workout";
import { calculate1RM } from "./utils";

/**
 * ローカルストレージから各種目の全記録を取得し、MAX重量を計算する
 * @returns 種目IDをキーとするMAX重量のマップ（1RMの最大値）
 */
export function calculateMaxWeights(): Record<string, number> {
  if (typeof window === "undefined") return {};

  const maxWeights: Record<string, number> = {};

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("workout_")) continue;

      // キー形式: workout_YYYY-MM-DD_exerciseId
      const parts = key.split("_");
      if (parts.length < 3) continue;

      const exerciseId = parts.slice(2).join("_"); // exerciseIdにアンダースコアが含まれる可能性があるため
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const sets = JSON.parse(stored) as SetRecord[];

        // 各セットから1RMを計算し、最大値を取得
        for (const set of sets) {
          // 重量と回数が有効な場合のみ計算
          if (
            set.weight !== undefined &&
            set.weight !== null &&
            set.weight > 0 &&
            set.reps > 0
          ) {
            const oneRM = calculate1RM(set.weight, set.reps);
            if (oneRM !== null) {
              // 既存のMAX重量と比較して、大きい方を保持
              if (!maxWeights[exerciseId] || oneRM > maxWeights[exerciseId]) {
                maxWeights[exerciseId] = oneRM;
              }
            }
          }
        }
      } catch (error) {
        // 個別のキーのパースエラーは無視して続行
        console.warn(`Failed to parse sets for key ${key}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error("Failed to calculate max weights:", error);
  }

  return maxWeights;
}
