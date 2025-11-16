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
  let previousMax: number | null = null;
  const progressData: Array<{ date: string; maxWeight: number }> = [];

  for (const row of maxWeightByDate) {
    const maxWeight =
      typeof row.maxWeight === "number"
        ? row.maxWeight
        : parseFloat(row.maxWeight.toString());

    // NaNや無効な値はスキップ
    if (isNaN(maxWeight) || maxWeight <= 0) {
      continue;
    }

    // 最初の記録、または最大重量が更新された場合のみ追加
    if (previousMax === null || maxWeight > previousMax) {
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
 * Big3種目を特定する（完全一致で判定）
 */
export function identifyBig3Exercises(
  big3Exercises: Array<{ id: string; name: string }>
): {
  benchPressId: string | undefined;
  squatId: string | undefined;
  deadliftId: string | undefined;
} {
  const benchPressId = big3Exercises.find((e) =>
    e.name.includes("ベンチプレス")
  )?.id;
  const squatId = big3Exercises.find((e) => e.name.includes("スクワット"))?.id;
  const deadliftId = big3Exercises.find((e) =>
    e.name.includes("デッドリフト")
  )?.id;

  return { benchPressId, squatId, deadliftId };
}

/**
 * データベースとローカルストレージのデータをマージ
 * 同じ日付のデータがある場合、大きい方を優先
 */
export function mergeProgressData(
  dbData: Array<{ date: string; maxWeight: number }>,
  storageData: Array<{ date: string; maxWeight: number }>
): Array<{ date: string; maxWeight: number }> {
  const merged = new Map<string, number>();

  // データベースのデータを追加
  for (const item of dbData) {
    merged.set(item.date, item.maxWeight);
  }

  // ローカルストレージのデータを追加（大きい方を優先）
  for (const item of storageData) {
    const existing = merged.get(item.date);
    if (!existing || item.maxWeight > existing) {
      merged.set(item.date, item.maxWeight);
    }
  }

  // 日付でソート
  return Array.from(merged.entries())
    .map(([date, maxWeight]) => ({ date, maxWeight }))
    .sort((a, b) => a.date.localeCompare(b.date));
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

/**
 * セット記録からその日の最大重量を計算する（ウォームアップセットを除外）
 * @param sets セット記録の配列
 * @returns その日の最大重量（kg）、有効な記録がない場合は0
 */
export function calculateDayMaxWeight(
  sets: Array<{ weight?: number | null; isWarmup?: boolean }>
): number {
  let dayMaxWeight = 0;

  for (const set of sets) {
    // ウォームアップセットは除外
    if (set.isWarmup) continue;
    // 重量が無効な場合はスキップ
    if (!set.weight || set.weight <= 0) continue;

    if (set.weight > dayMaxWeight) {
      dayMaxWeight = set.weight;
    }
  }

  return dayMaxWeight;
}
