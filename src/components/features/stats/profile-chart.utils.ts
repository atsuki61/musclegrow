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

/**
 * 表示範囲とデータから、X軸に表示すべき日付のインデックスを計算
 * - 表示範囲の最初と最後
 * - 年の区切り
 */
export function calculateVisibleXAxisTicks(
  chartData: Array<{ date: string; fullDate: string }>,
  scrollLeft: number,
  containerWidth: number,
  chartWidth: number,
  cellWidth: number
): {
  indices: number[];
  yearChangeIndices: Set<number>;
} {
  if (chartData.length === 0) return { indices: [], yearChangeIndices: new Set() };
  if (chartData.length === 1) {
    return { indices: [0], yearChangeIndices: new Set() };
  }

  // 表示されている範囲のインデックスを計算
  const startIndex = Math.max(0, Math.floor(scrollLeft / cellWidth));
  const endIndex = Math.min(
    chartData.length - 1,
    Math.ceil((scrollLeft + containerWidth) / cellWidth)
  );

  const indices: number[] = [];
  const yearChangeIndices = new Set<number>();

  // 表示範囲の最初
  if (startIndex < chartData.length) {
    indices.push(startIndex);
  }

  // 年の区切りを検出
  for (let i = startIndex + 1; i <= endIndex; i++) {
    const currentYear = new Date(chartData[i].fullDate).getFullYear();
    const prevYear = new Date(chartData[i - 1].fullDate).getFullYear();

    if (currentYear !== prevYear) {
      indices.push(i);
      yearChangeIndices.add(i);
    }
  }

  // 表示範囲の最後
  if (endIndex > startIndex && !indices.includes(endIndex)) {
    indices.push(endIndex);
  }

  return { indices, yearChangeIndices };
}

