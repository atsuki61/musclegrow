/**
 * 前回記録取得用のユーティリティ関数
 * ローカルストレージから同じ種目の前回記録を取得
 */

import type { SetRecord, CardioRecord } from "@/types/workout";
import { formatDateToYYYYMMDD } from "@/lib/utils";

/**
 * 日付文字列を比較する（YYYY-MM-DD形式）
 * @param date1 日付1
 * @param date2 日付2
 * @returns date1がdate2より前の場合true、それ以外はfalse
 */
const isDateBefore = (date1: Date, date2: Date): boolean => {
  const date1Str = formatDateToYYYYMMDD(date1); // ローカルタイムゾーンで変換
  const date2Str = formatDateToYYYYMMDD(date2); // ローカルタイムゾーンで変換
  return date1Str < date2Str;
};

/**
 * ローカルストレージから前回のセット記録を取得
 * @param currentDate 現在の日付
 * @param exerciseId 種目ID
 * @returns 前回記録（セット配列と日付）、見つからない場合はnull
 */
export const getPreviousWorkoutRecord = (
  currentDate: Date,
  exerciseId: string
): { sets: SetRecord[]; date: Date } | null => {
  if (typeof window === "undefined") return null;

  try {
    let latestDate: Date | null = null;
    let latestSets: SetRecord[] | null = null;

    // ローカルストレージの全キーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // workout_で始まるキーのみを対象
      if (!key.startsWith("workout_")) continue;

      // キーから日付と種目IDを抽出
      const parts = key.split("_");
      if (parts.length !== 3) continue;

      const dateStr = parts[1];
      const exerciseIdFromKey = parts[2];

      // 種目IDが一致しない場合はスキップ
      if (exerciseIdFromKey !== exerciseId) continue;

      // 日付をパース
      const recordDate = new Date(dateStr + "T00:00:00");
      if (isNaN(recordDate.getTime())) continue;

      // 現在の日付より前の日付のみを対象
      if (!isDateBefore(recordDate, currentDate)) continue;

      // より最近の日付を探す
      if (!latestDate || recordDate > latestDate) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as SetRecord[];
            // 有効なデータがある場合のみ
            const hasValidData = parsed.some(
              (set) =>
                (set.weight ?? 0) > 0 || set.reps > 0 || (set.duration ?? 0) > 0
            );
            if (hasValidData && parsed.length > 0) {
              latestDate = recordDate;
              latestSets = parsed;
            }
          } catch (error) {
            console.error("Failed to parse previous record:", error);
          }
        }
      }
    }

    if (latestDate && latestSets) {
      return {
        sets: latestSets,
        date: latestDate,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get previous workout record:", error);
    return null;
  }
};

/**
 * ローカルストレージから前回の有酸素種目記録を取得
 * @param currentDate 現在の日付
 * @param exerciseId 種目ID
 * @returns 前回記録（記録配列と日付）、見つからない場合はnull
 */
export const getPreviousCardioRecord = (
  currentDate: Date,
  exerciseId: string
): { records: CardioRecord[]; date: Date } | null => {
  if (typeof window === "undefined") return null;

  try {
    let latestDate: Date | null = null;
    let latestRecords: CardioRecord[] | null = null;

    // ローカルストレージの全キーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // cardio_で始まるキーのみを対象
      if (!key.startsWith("cardio_")) continue;

      // キーから日付と種目IDを抽出
      const parts = key.split("_");
      if (parts.length !== 3) continue;

      const dateStr = parts[1];
      const exerciseIdFromKey = parts[2];

      // 種目IDが一致しない場合はスキップ
      if (exerciseIdFromKey !== exerciseId) continue;

      // 日付をパース
      const recordDate = new Date(dateStr + "T00:00:00");
      if (isNaN(recordDate.getTime())) continue;

      // 現在の日付より前の日付のみを対象
      if (!isDateBefore(recordDate, currentDate)) continue;

      // より最近の日付を探す
      if (!latestDate || recordDate > latestDate) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as CardioRecord[];
            // 日付文字列をDateオブジェクトに変換
            const records = parsed.map((record) => ({
              ...record,
              date: new Date(record.date),
            }));
            // 有効なデータがある場合のみ
            const hasValidData = records.some(
              (record) =>
                record.duration > 0 ||
                (record.distance ?? 0) > 0 ||
                (record.calories ?? 0) > 0
            );
            if (hasValidData && records.length > 0) {
              latestDate = recordDate;
              latestRecords = records;
            }
          } catch (error) {
            console.error("Failed to parse previous cardio record:", error);
          }
        }
      }
    }

    if (latestDate && latestRecords) {
      return {
        records: latestRecords,
        date: latestDate,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get previous cardio record:", error);
    return null;
  }
};
