"use client";

import type { SetRecord } from "@/types/workout";
import { parseStorageKey } from "./local-storage-history";
import { format } from "date-fns";
import type { DateRangePreset } from "@/types/stats";
import {
  getStartDate,
  extractMaxWeightUpdates,
  calculateDayMaxWeight,
} from "./utils/stats";

/**
 * ローカルストレージからBig3種目の推移データを取得する
 */
export function getBig3ProgressDataFromStorage({
  preset = "month",
  big3ExerciseIds,
}: {
  preset?: DateRangePreset;
  big3ExerciseIds: {
    benchPressId?: string;
    squatId?: string;
    deadliftId?: string;
  };
}): {
  benchPress: Array<{ date: string; maxWeight: number }>;
  squat: Array<{ date: string; maxWeight: number }>;
  deadlift: Array<{ date: string; maxWeight: number }>;
} {
  if (typeof window === "undefined") {
    return {
      benchPress: [],
      squat: [],
      deadlift: [],
    };
  }

  const startDate = getStartDate(preset);
  const startDateStr = format(startDate, "yyyy-MM-dd");

  const result = {
    benchPress: [] as Array<{ date: string; maxWeight: number }>,
    squat: [] as Array<{ date: string; maxWeight: number }>,
    deadlift: [] as Array<{ date: string; maxWeight: number }>,
  };

  // 日付ごとの最大重量を記録するマップ
  const maxWeightByDate: Record<
    string,
    {
      benchPress: number;
      squat: number;
      deadlift: number;
    }
  > = {};

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("workout_")) continue;

      const keyInfo = parseStorageKey(key);
      if (!keyInfo || keyInfo.type !== "workout") continue;

      const { dateStr, exerciseId } = keyInfo;

      // 開始日以降のデータのみを処理
      if (dateStr < startDateStr) continue;

      // Big3種目でない場合はスキップ
      let exerciseType: "benchPress" | "squat" | "deadlift" | null = null;
      if (exerciseId === big3ExerciseIds.benchPressId) {
        exerciseType = "benchPress";
      } else if (exerciseId === big3ExerciseIds.squatId) {
        exerciseType = "squat";
      } else if (exerciseId === big3ExerciseIds.deadliftId) {
        exerciseType = "deadlift";
      }

      if (!exerciseType) continue;

      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const sets = JSON.parse(stored) as SetRecord[];

        // その日の最大重量を計算（ウォームアップセットを除外）
        const dayMaxWeight = calculateDayMaxWeight(sets);

        if (dayMaxWeight > 0) {
          // 日付ごとの最大重量を記録
          if (!maxWeightByDate[dateStr]) {
            maxWeightByDate[dateStr] = {
              benchPress: 0,
              squat: 0,
              deadlift: 0,
            };
          }

          const currentMax = maxWeightByDate[dateStr][exerciseType];
          if (dayMaxWeight > currentMax) {
            maxWeightByDate[dateStr][exerciseType] = dayMaxWeight;
          }
        }
      } catch (error) {
        console.warn(`Failed to parse sets for key ${key}:`, error);
        continue;
      }
    }

    // 日付ごとの最大重量を各種目の配列に変換
    const benchPressData = Object.entries(maxWeightByDate)
      .filter(([, weights]) => weights.benchPress > 0)
      .map(([date, weights]) => ({
        date,
        maxWeight: weights.benchPress,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const squatData = Object.entries(maxWeightByDate)
      .filter(([, weights]) => weights.squat > 0)
      .map(([date, weights]) => ({
        date,
        maxWeight: weights.squat,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const deadliftData = Object.entries(maxWeightByDate)
      .filter(([, weights]) => weights.deadlift > 0)
      .map(([date, weights]) => ({
        date,
        maxWeight: weights.deadlift,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 最大重量が更新された日のみを抽出
    result.benchPress = extractMaxWeightUpdates(benchPressData);
    result.squat = extractMaxWeightUpdates(squatData);
    result.deadlift = extractMaxWeightUpdates(deadliftData);
  } catch (error) {
    console.error("Failed to get Big3 progress data from storage:", error);
  }

  return result;
}
