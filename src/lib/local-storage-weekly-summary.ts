"use client";

import { parseStorageKey } from "./local-storage-history";
import {
  buildWeeklySummary,
  type WeekRange,
  type WeeklySummary,
  type DailyVolume,
} from "./utils/weekly-summary";
import type { SetRecord } from "@/types/workout";

/**
 * localStorage の workout_* 記録から週間サマリーを集計する（ゲスト用）
 * 有効セット条件: NOT isWarmup AND weight>0 AND reps>0（DB系と同一）
 */
export function getWeeklySummaryFromStorage(range: WeekRange): WeeklySummary {
  if (typeof window === "undefined") {
    return buildWeeklySummary([], 0, range);
  }

  const weekByDate = new Map<string, DailyVolume>();
  let prevWeekVolume = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const info = parseStorageKey(key);
      if (!info || info.type !== "workout") continue;

      const inThisWeek =
        info.dateStr >= range.weekStart && info.dateStr <= range.weekEnd;
      const inPrevWeek =
        info.dateStr >= range.prevWeekStart &&
        info.dateStr <= range.prevWeekEnd;
      if (!inThisWeek && !inPrevWeek) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;
      const sets = parsed as SetRecord[];

      let dayVolume = 0;
      let dayCount = 0;
      for (const set of sets) {
        // isWarmup が undefined/falsy の場合は通常セット扱い（DB の isWarmup = false DEFAULT と等価）
        if (set.isWarmup) continue;
        const weight =
          typeof set.weight === "number" ? set.weight : Number(set.weight);
        if (!Number.isFinite(weight) || weight <= 0) continue;
        if (!set.reps || set.reps <= 0) continue;
        dayVolume += weight * set.reps;
        dayCount += 1;
      }
      if (dayCount === 0) continue;

      if (inThisWeek) {
        const entry =
          weekByDate.get(info.dateStr) ??
          ({ date: info.dateStr, volume: 0, setCount: 0 } as DailyVolume);
        entry.volume += dayVolume;
        entry.setCount += dayCount;
        weekByDate.set(info.dateStr, entry);
      } else {
        prevWeekVolume += dayVolume;
      }
    }
  } catch (error) {
    console.warn("週間サマリーのローカル集計に失敗:", error);
  }

  return buildWeeklySummary(
    Array.from(weekByDate.values()),
    prevWeekVolume,
    range
  );
}
