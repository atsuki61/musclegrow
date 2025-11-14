/**
 * グラフ機能用のユーティリティ関数
 */

import type { DateRangePreset } from "@/types/stats";
import { subDays, subMonths, subYears } from "date-fns";

/**
 * 期間プリセットから開始日を取得
 */
export function getStartDate(preset: DateRangePreset): Date {
  const now = new Date();
  switch (preset) {
    case "week":
      return subDays(now, 7);
    case "month":
      return subMonths(now, 1);
    case "3months":
      return subMonths(now, 3);
    case "6months":
      return subMonths(now, 6);
    case "year":
      return subYears(now, 1);
    case "all":
      return new Date(0); // 1970-01-01
    default:
      return subMonths(now, 1);
  }
}

/**
 * 最大重量が更新された日のみを抽出する
 */
export function extractMaxWeightUpdates(
  maxWeightByDate: Array<{ date: string; maxWeight: number | string }>
): Array<{ date: string; maxWeight: number }> {
  let previousMax = 0;
  const progressData: Array<{ date: string; maxWeight: number }> = [];

  for (const row of maxWeightByDate) {
    const maxWeight =
      typeof row.maxWeight === "number"
        ? row.maxWeight
        : parseFloat(row.maxWeight.toString());

    if (maxWeight > previousMax) {
      progressData.push({
        date: row.date,
        maxWeight,
      });
      previousMax = maxWeight;
    }
  }

  return progressData;
}

/**
 * Big3種目を特定する
 */
export function identifyBig3Exercises(
  big3Exercises: Array<{ id: string; name: string }>
): {
  benchPressId: string | undefined;
  squatId: string | undefined;
  deadliftId: string | undefined;
} {
  const benchPressId = big3Exercises.find(
    (e) => e.name.includes("ベンチ") || e.name.toLowerCase().includes("bench")
  )?.id;
  const squatId = big3Exercises.find(
    (e) =>
      e.name.includes("スクワット") || e.name.toLowerCase().includes("squat")
  )?.id;
  const deadliftId = big3Exercises.find(
    (e) =>
      e.name.includes("デッド") || e.name.toLowerCase().includes("deadlift")
  )?.id;

  return { benchPressId, squatId, deadliftId };
}

/**
 * 数値に変換（null/undefined対応）
 */
export function toNumber(
  value: string | number | null | undefined | unknown
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

