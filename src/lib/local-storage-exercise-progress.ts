"use client";

import type { SetRecord } from "@/types/workout";
import { parseStorageKey } from "./local-storage-history";
import { format } from "date-fns";
import type { DateRangePreset, ExerciseProgressData } from "@/types/stats";
import { getStartDate, extractMaxWeightUpdates, calculateDayMaxWeight } from "./utils/stats";

/**
 * ローカルストレージから記録がある種目IDのSetを取得する
 */
export function getExercisesWithDataFromStorage(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  const exerciseIds = new Set<string>();

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("workout_")) continue;

      const keyInfo = parseStorageKey(key);
      if (!keyInfo || keyInfo.type !== "workout") continue;

      const { exerciseId } = keyInfo;

      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const sets = JSON.parse(stored) as SetRecord[];
        // データがある場合のみ追加
        if (sets.length > 0) {
          exerciseIds.add(exerciseId);
        }
      } catch (error) {
        console.warn(`Failed to parse sets for key ${key}:`, error);
        continue;
      }
    }

    return exerciseIds;
  } catch (error) {
    console.error("Failed to get exercises with data from storage:", error);
    return new Set();
  }
}

/**
 * ローカルストレージから種目別の推移データを取得する
 */
export function getExerciseProgressDataFromStorage({
  exerciseId,
  preset = "month",
}: {
  exerciseId: string;
  preset?: DateRangePreset;
}): ExerciseProgressData[] {
  if (typeof window === "undefined") {
    return [];
  }

  const startDate = getStartDate(preset);
  const startDateStr = format(startDate, "yyyy-MM-dd");

  // 日付ごとの最大重量を記録するマップ
  const maxWeightByDate: Record<string, number> = {};

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("workout_")) continue;

      const keyInfo = parseStorageKey(key);
      if (!keyInfo || keyInfo.type !== "workout") continue;

      const { dateStr, exerciseId: keyExerciseId } = keyInfo;

      // 指定された種目IDと一致しない場合はスキップ
      if (keyExerciseId !== exerciseId) continue;

      // 開始日以降のデータのみを処理
      if (dateStr < startDateStr) continue;

      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const sets = JSON.parse(stored) as SetRecord[];

        // その日の最大重量を計算（ウォームアップセットを除外）
        const dayMaxWeight = calculateDayMaxWeight(sets);

        if (dayMaxWeight > 0) {
          // 日付ごとの最大重量を記録（大きい方を優先）
          const currentMax = maxWeightByDate[dateStr] || 0;
          if (dayMaxWeight > currentMax) {
            maxWeightByDate[dateStr] = dayMaxWeight;
          }
        }
      } catch (error) {
        console.warn(`Failed to parse sets for key ${key}:`, error);
        continue;
      }
    }

    // 日付ごとの最大重量を配列に変換
    const progressData = Object.entries(maxWeightByDate)
      .map(([date, maxWeight]) => ({
        date,
        maxWeight,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 最大重量が更新された日のみを抽出
    return extractMaxWeightUpdates(progressData);
  } catch (error) {
    console.error("Failed to get exercise progress data from storage:", error);
    return [];
  }
}
