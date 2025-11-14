/**
 * プロフィールグラフ用のユーティリティ関数
 */

import type { ProfileHistoryData, ProfileChartType } from "@/types/stats";
import { format, subDays, addDays } from "date-fns";

/**
 * グラフ用データに変換
 */
export function transformChartData(
  data: ProfileHistoryData[],
  chartType: ProfileChartType
): Array<{ date: string; fullDate: string; value: number }> {
  return data
    .map((item) => {
      const value =
        chartType === "weight"
          ? item.weight
          : chartType === "bodyFat"
          ? item.bodyFat
          : chartType === "muscleMass"
          ? item.muscleMass
          : item.bmi;

      if (value === null) return null;

      return {
        date: format(new Date(item.recordedAt), "M/d"),
        fullDate: item.recordedAt,
        value,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * X軸のドメインを計算（データが1点の場合のタイムライン用）
 */
export function calculateXAxisDomain(
  chartData: Array<{ fullDate: string }>
): string[] | undefined {
  if (chartData.length !== 1) return undefined;

  const baseDate = new Date(chartData[0].fullDate);
  return [
    format(subDays(baseDate, 2), "M/d"),
    format(subDays(baseDate, 1), "M/d"),
    format(baseDate, "M/d"),
    format(addDays(baseDate, 1), "M/d"),
    format(addDays(baseDate, 2), "M/d"),
  ];
}

/**
 * Y軸のドメインを計算
 */
export function calculateYAxisDomain(
  chartData: Array<{ value: number }>
): [number, number] {
  const values = chartData.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  return [Math.max(0, minValue - 5), maxValue + 5];
}

/**
 * 最も近いデータポイントのインデックスを取得
 */
export function findClosestDataPointIndex(
  x: number,
  dataPointCoordinates: Array<{ cx: number }>,
  threshold: number = 50
): number | null {
  let minDistance = Infinity;
  let closestIndex: number | null = null;

  dataPointCoordinates.forEach((point, index) => {
    const distance = Math.abs(point.cx - x);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex !== null && minDistance < threshold
    ? closestIndex
    : null;
}

