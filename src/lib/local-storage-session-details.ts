"use client";

import { format } from "date-fns";
import type { SetRecord, CardioRecord } from "@/types/workout";
import {
  parseStorageKey,
  isValidSets,
  isValidCardioRecords,
} from "./local-storage-history";

/**
 * ローカルストレージから日付のセッション詳細を取得する
 * @param date 日付
 * @returns セッション詳細
 */
export function getSessionDetailsFromStorage({
  date,
}: {
  date: Date;
}): {
  workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
  cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
} {
  if (typeof window === "undefined") {
    return { workoutExercises: [], cardioExercises: [] };
  }

  const dateStr = format(date, "yyyy-MM-dd");
  const workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }> = [];
  const cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }> = [];

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const parsed = parseStorageKey(key);
      if (!parsed) continue;

      const { dateStr: keyDateStr, exerciseId, type } = parsed;

      // 指定された日付のキーのみ処理
      if (keyDateStr !== dateStr) continue;

      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        if (type === "workout") {
          const sets = JSON.parse(stored) as SetRecord[];
          if (isValidSets(sets)) {
            workoutExercises.push({ exerciseId, sets });
          }
        } else {
          const records = JSON.parse(stored) as CardioRecord[];
          if (isValidCardioRecords(records)) {
            cardioExercises.push({ exerciseId, records });
          }
        }
      } catch (error) {
        console.warn(`Failed to parse ${type} records for key ${key}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error("Failed to get session details from storage:", error);
  }

  return { workoutExercises, cardioExercises };
}

