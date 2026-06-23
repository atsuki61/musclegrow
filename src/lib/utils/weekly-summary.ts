/**
 * 週間ボリュームサマリー用の純粋ユーティリティ
 * DB集計・localStorage集計の両系統が共有する
 */

import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  format,
  parseISO,
  differenceInCalendarDays,
  getDay,
} from "date-fns";

export interface WeekRange {
  weekStart: string; // yyyy-MM-dd（月曜）
  weekEnd: string; // yyyy-MM-dd（日曜）
  prevWeekStart: string;
  prevWeekEnd: string;
}

export interface DailyVolume {
  date: string; // yyyy-MM-dd
  volume: number; // その日の Σ(weight*reps)（有効セット）
  setCount: number; // その日の有効セット件数
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  trainedDays: boolean[]; // 月→日の7要素
  gymCount: number;
  totalVolume: number;
  totalSets: number;
  prevWeekVolume: number;
}

// 現在時刻をJSTの暦日 yyyy-MM-dd に変換（実行環境TZに依存しない）
function jstDateParts(now: Date): { y: number; m: number; d: number } {
  const str = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = str.split("-").map(Number);
  return { y, m, d };
}

export function getWeekRange(now: Date = new Date()): WeekRange {
  const { y, m, d } = jstDateParts(now);
  const base = new Date(y, m - 1, d);
  const ws = startOfWeek(base, { weekStartsOn: 1 });
  const we = endOfWeek(base, { weekStartsOn: 1 });
  return {
    weekStart: format(ws, "yyyy-MM-dd"),
    weekEnd: format(we, "yyyy-MM-dd"),
    prevWeekStart: format(subWeeks(ws, 1), "yyyy-MM-dd"),
    prevWeekEnd: format(subWeeks(we, 1), "yyyy-MM-dd"),
  };
}

export function getJstWeekdayIndex(now: Date = new Date()): number {
  const { y, m, d } = jstDateParts(now);
  // getDay: 0=日..6=土 → 月=0..日=6 に変換
  return (getDay(new Date(y, m - 1, d)) + 6) % 7;
}

export function calcVolumeDelta(current: number, prev: number): number | null {
  if (!prev || prev <= 0) return null;
  return ((current - prev) / prev) * 100;
}

export function buildWeeklySummary(
  weekDays: DailyVolume[],
  prevWeekVolume: number,
  range: WeekRange
): WeeklySummary {
  const trainedDays = [false, false, false, false, false, false, false];
  let totalVolume = 0;
  let totalSets = 0;
  const start = parseISO(range.weekStart);

  for (const day of weekDays) {
    const idx = differenceInCalendarDays(parseISO(day.date), start);
    if (idx >= 0 && idx < 7) {
      trainedDays[idx] = true;
      totalVolume += day.volume;
      totalSets += day.setCount;
    }
  }

  return {
    weekStart: range.weekStart,
    weekEnd: range.weekEnd,
    trainedDays,
    gymCount: trainedDays.filter(Boolean).length,
    totalVolume,
    totalSets,
    prevWeekVolume,
  };
}

export function mergeWeeklySummary(
  a: WeeklySummary,
  b: WeeklySummary
): WeeklySummary {
  const trainedDays = a.trainedDays.map((v, i) => v || b.trainedDays[i]);
  return {
    weekStart: a.weekStart,
    weekEnd: a.weekEnd,
    trainedDays,
    gymCount: trainedDays.filter(Boolean).length,
    totalVolume: a.totalVolume + b.totalVolume,
    totalSets: a.totalSets + b.totalSets,
    prevWeekVolume: a.prevWeekVolume + b.prevWeekVolume,
  };
}

export function emptyWeeklySummary(range: WeekRange): WeeklySummary {
  return buildWeeklySummary([], 0, range);
}
