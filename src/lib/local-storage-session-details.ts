//セッション詳細管理
"use client";

import { format } from "date-fns";
import type { SetRecord, CardioRecord } from "@/types/workout";
import {
  parseStorageKey,
  isValidSets,
  isValidCardioRecords,
} from "./local-storage-history";

/**
 * ワークアウト記録をパースして検証する
 * @param storedValue ローカルストレージから取得したJSON文字列
 * @returns 検証済みのセット記録、またはnull（無効な場合）
 */
function parseAndValidateWorkoutRecord(
  storedValue: string
): SetRecord[] | null {
  try {
    const sets = JSON.parse(storedValue) as SetRecord[];
    return isValidSets(sets) ? sets : null;
  } catch (error) {
    console.warn("Failed to parse workout record:", error);
    return null;
  }
}

/**
 * 有酸素記録をパースして検証する
 * @param storedValue ローカルストレージから取得したJSON文字列
 * @returns 検証済みの有酸素記録、またはnull（無効な場合）
 */
function parseAndValidateCardioRecord(
  storedValue: string
): CardioRecord[] | null {
  try {
    const records = JSON.parse(storedValue) as CardioRecord[];
    return isValidCardioRecords(records) ? records : null;
  } catch (error) {
    console.warn("Failed to parse cardio record:", error);
    return null;
  }
}

/**
 * ローカルストレージのキーから記録を取得して追加する
 * @param key ローカルストレージのキー
 * @param targetDateStr 対象日付（yyyy-MM-dd形式）
 * @param workoutExercises ワークアウト記録を追加する配列
 * @param cardioExercises 有酸素記録を追加する配列
 */
function processStorageKey(
  key: string,
  targetDateStr: string,
  workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>,
  cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>
): void {
  // キーを解析（日付、種目ID、タイプを取得）
  const keyInfo = parseStorageKey(key);
  if (!keyInfo) {
    return; // 無効なキーはスキップ
  }

  const { dateStr: keyDateStr, exerciseId, type } = keyInfo;

  // 指定された日付のキーのみ処理
  if (keyDateStr !== targetDateStr) {
    return;
  }

  // ローカルストレージから値を取得
  const storedValue = localStorage.getItem(key);
  if (!storedValue) {
    return;
  }

  // タイプに応じてパース・検証・追加
  if (type === "workout") {
    const sets = parseAndValidateWorkoutRecord(storedValue);
    if (sets) {
      workoutExercises.push({ exerciseId, sets });
    }
  } else {
    const records = parseAndValidateCardioRecord(storedValue);
    if (records) {
      cardioExercises.push({ exerciseId, records });
    }
  }
}

/**
 * ローカルストレージから日付のセッション詳細を取得する
 * @param date 日付
 * @returns セッション詳細
 */
export function getSessionDetailsFromStorage({ date }: { date: Date }): {
  workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
  cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
} {
  // サーバーサイドでは空の結果を返す
  if (typeof window === "undefined") {
    return { workoutExercises: [], cardioExercises: [] };
  }

  const targetDateStr = format(date, "yyyy-MM-dd");
  const workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }> = [];
  const cardioExercises: Array<{
    exerciseId: string;
    records: CardioRecord[];
  }> = [];

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) {
        continue;
      }

      processStorageKey(key, targetDateStr, workoutExercises, cardioExercises);
    }
  } catch (error) {
    console.error("Failed to get session details from storage:", error);
  }

  return { workoutExercises, cardioExercises };
}
