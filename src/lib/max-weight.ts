"use client";

import type { SetRecord } from "@/types/workout";
import { parseStorageKey } from "./local-storage-utils";

/**
 * ローカルストレージから各種目の全記録を取得し、実際のMAX重量を計算する
 * 1RM（理論値）ではなく、実際に入力された最大重量を返す
 * @returns 種目IDをキーとするMAX重量のマップ（実際の最大重量）
 */
export function calculateMaxWeights(): Record<string, number> {
  if (typeof window === "undefined") return {};

  const maxWeights: Record<string, number> = {};

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("workout_")) continue;

      const parsed = parseStorageKey(key);
      if (!parsed) continue;

      const { exerciseId } = parsed;
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const sets = JSON.parse(stored) as SetRecord[];

        // 各セットから実際の重量の最大値を取得
        for (const set of sets) {
          // 重量が有効な場合のみ計算
          if (
            set.weight !== undefined &&
            set.weight !== null &&
            set.weight > 0
          ) {
            // 既存のMAX重量と比較して、大きい方を保持
            if (
              !maxWeights[exerciseId] ||
              set.weight > maxWeights[exerciseId]
            ) {
              maxWeights[exerciseId] = set.weight;
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
