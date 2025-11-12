"use client";

import type { BodyPart, Exercise } from "@/types/workout";
import type { SetRecord, CardioRecord } from "@/types/workout";
import {
  parseStorageKey,
  isValidSets,
  isValidCardioRecords,
} from "./local-storage-history";

/**
 * 日付文字列をDateオブジェクトに変換する
 * @param dateStr YYYY-MM-DD形式の日付文字列
 * @returns Dateオブジェクト、無効な場合はnull
 */
function parseDateFromString(dateStr: string): Date | null {
  const date = new Date(dateStr + "T00:00:00");
  return isNaN(date.getTime()) ? null : date;
}

/**
 * ワークアウト記録から最後のトレーニング日時を更新する
 * @param exerciseId 種目ID
 * @param recordDate 記録日時
 * @param storedValue ローカルストレージから取得したJSON文字列
 * @param lastTrainedDates 最後のトレーニング日時のマップ（更新される）
 */
function updateLastTrainedDateForWorkout(
  exerciseId: string,
  recordDate: Date,
  storedValue: string,
  lastTrainedDates: Record<string, Date>
): void {
  try {
    const sets = JSON.parse(storedValue) as SetRecord[];
    if (!isValidSets(sets) || sets.length === 0) {
      return;
    }

    // 既存の日時と比較して、新しい方を保持
    if (
      !lastTrainedDates[exerciseId] ||
      recordDate > lastTrainedDates[exerciseId]
    ) {
      lastTrainedDates[exerciseId] = recordDate;
    }
  } catch (error) {
    console.warn(
      `Failed to parse workout record for exercise ${exerciseId}:`,
      error
    );
  }
}

/**
 * 有酸素記録から最後のトレーニング日時を更新する
 * @param exerciseId 種目ID
 * @param recordDate 記録日時
 * @param storedValue ローカルストレージから取得したJSON文字列
 * @param lastTrainedDates 最後のトレーニング日時のマップ（更新される）
 */
function updateLastTrainedDateForCardio(
  exerciseId: string,
  recordDate: Date,
  storedValue: string,
  lastTrainedDates: Record<string, Date>
): void {
  try {
    const records = JSON.parse(storedValue) as CardioRecord[];
    if (!isValidCardioRecords(records) || records.length === 0) {
      return;
    }

    // 既存の日時と比較して、新しい方を保持
    if (
      !lastTrainedDates[exerciseId] ||
      recordDate > lastTrainedDates[exerciseId]
    ) {
      lastTrainedDates[exerciseId] = recordDate;
    }
  } catch (error) {
    console.warn(
      `Failed to parse cardio record for exercise ${exerciseId}:`,
      error
    );
  }
}

/**
 * ローカルストレージのキーから最後のトレーニング日時を更新する
 * @param key ローカルストレージのキー
 * @param lastTrainedDates 最後のトレーニング日時のマップ（更新される）
 */
function processStorageKeyForLastTrained(
  key: string,
  lastTrainedDates: Record<string, Date>
): void {
  // キーを解析（日付、種目ID、タイプを取得）
  const keyInfo = parseStorageKey(key);
  if (!keyInfo) {
    return; // 無効なキーはスキップ
  }

  const { dateStr, exerciseId, type } = keyInfo;

  // 日付文字列をDateオブジェクトに変換
  const recordDate = parseDateFromString(dateStr);
  if (!recordDate) {
    return; // 無効な日付はスキップ
  }

  // ローカルストレージから値を取得
  const storedValue = localStorage.getItem(key);
  if (!storedValue) {
    return;
  }

  // タイプに応じて処理
  if (type === "workout") {
    updateLastTrainedDateForWorkout(
      exerciseId,
      recordDate,
      storedValue,
      lastTrainedDates
    );
  } else {
    updateLastTrainedDateForCardio(
      exerciseId,
      recordDate,
      storedValue,
      lastTrainedDates
    );
  }
}

/**
 * ローカルストレージから各種目の最後のトレーニング日時を取得する
 * @returns 種目IDをキーとする最後のトレーニング日時のマップ
 */
export function getLastTrainedDates(): Record<string, Date> {
  if (typeof window === "undefined") {
    return {};
  }

  const lastTrainedDates: Record<string, Date> = {};

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) {
        continue;
      }

      processStorageKeyForLastTrained(key, lastTrainedDates);
    }
  } catch (error) {
    console.error("Failed to get last trained dates:", error);
  }

  return lastTrainedDates;
}

/**
 * 部位ごとの最後のトレーニング日時を計算する
 * @param exercises 種目リスト
 * @param lastTrainedDates 種目IDをキーとする最後のトレーニング日時のマップ
 * @returns 部位をキーとする最後のトレーニング日時のマップ
 */
export function getLastTrainedDatesByBodyPart(
  exercises: Exercise[],
  lastTrainedDates: Record<string, Date>
): Record<BodyPart, Date | undefined> {
  const lastTrainedByBodyPart: Record<string, Date | undefined> = {};

  // 部位ごとに種目をグループ化
  const exercisesByBodyPart = exercises.reduce((acc, exercise) => {
    const bodyPart = exercise.bodyPart;
    if (!acc[bodyPart]) {
      acc[bodyPart] = [];
    }
    acc[bodyPart].push(exercise);
    return acc;
  }, {} as Record<BodyPart, Exercise[]>);

  // 部位ごとに最新のトレーニング日時を計算
  for (const [bodyPart, bodyPartExercises] of Object.entries(
    exercisesByBodyPart
  )) {
    let latestDate: Date | undefined;

    for (const exercise of bodyPartExercises) {
      const exerciseLastTrained = lastTrainedDates[exercise.id];
      if (exerciseLastTrained) {
        if (!latestDate || exerciseLastTrained > latestDate) {
          latestDate = exerciseLastTrained;
        }
      }
    }

    lastTrainedByBodyPart[bodyPart] = latestDate;
  }

  return lastTrainedByBodyPart as Record<BodyPart, Date | undefined>;
}
