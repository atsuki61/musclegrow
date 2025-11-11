"use client";

/**
 * ローカルストレージのキー解析用ユーティリティ
 * workout_YYYY-MM-DD_exerciseId または cardio_YYYY-MM-DD_exerciseId 形式のキーを解析
 */

/**
 * ローカルストレージキーから日付と種目IDを抽出する
 * @param key ローカルストレージのキー（workout_YYYY-MM-DD_exerciseId または cardio_YYYY-MM-DD_exerciseId 形式）
 * @returns 日付文字列と種目ID、解析できない場合はnull
 */
export function parseStorageKey(
  key: string
): { dateStr: string; exerciseId: string } | null {
  // キー形式: workout_YYYY-MM-DD_exerciseId または cardio_YYYY-MM-DD_exerciseId
  const parts = key.split("_");
  if (parts.length < 3) return null;

  const dateStr = parts[1]; // YYYY-MM-DD形式
  const exerciseId = parts.slice(2).join("_"); // exerciseIdにアンダースコアが含まれる可能性があるため

  return { dateStr, exerciseId };
}

/**
 * 日付文字列をDateオブジェクトに変換する
 * @param dateStr YYYY-MM-DD形式の日付文字列
 * @returns Dateオブジェクト、無効な場合はnull
 */
export function parseDateString(dateStr: string): Date | null {
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return null;
  return date;
}

