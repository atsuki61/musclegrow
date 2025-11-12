"use client";

import { isAfter, isBefore } from "date-fns";
import type {
  BodyPart,
  Exercise,
  SetRecord,
  CardioRecord,
} from "@/types/workout";

/**
 * ローカルストレージのキーから日付と種目IDを解析する
 * @param key ローカルストレージのキー（workout_YYYY-MM-DD_exerciseId または cardio_YYYY-MM-DD_exerciseId）
 * @returns 日付文字列と種目ID、またはnull（無効なキーの場合）
 */
export function parseStorageKey(
  key: string
): { dateStr: string; exerciseId: string; type: "workout" | "cardio" } | null {
  if (key.startsWith("workout_")) {
    const parts = key.split("_");
    if (parts.length < 3) return null;
    const dateStr = parts[1];
    const exerciseId = parts.slice(2).join("_");
    return { dateStr, exerciseId, type: "workout" };
  } else if (key.startsWith("cardio_")) {
    const parts = key.split("_");
    if (parts.length < 3) return null;
    const dateStr = parts[1];
    const exerciseId = parts.slice(2).join("_");
    return { dateStr, exerciseId, type: "cardio" };
  }
  return null;
}

/**
 * セット記録が有効かどうかをチェックする
 * @param sets セット記録の配列
 * @returns 有効なデータがある場合true
 */
export function isValidSets(sets: SetRecord[]): boolean {
  if (sets.length === 0) return false;
  return sets.some(
    (set) => (set.weight ?? 0) > 0 || set.reps > 0 || (set.duration ?? 0) > 0
  );
}

/**
 * 有酸素記録が有効かどうかをチェックする
 * @param records 有酸素記録の配列
 * @returns 有効なデータがある場合true
 */
export function isValidCardioRecords(records: CardioRecord[]): boolean {
  if (records.length === 0) return false;
  return records.some(
    (record) =>
      record.duration > 0 ||
      (record.distance ?? 0) > 0 ||
      (record.calories ?? 0) > 0 ||
      (record.heartRate ?? 0) > 0
  );
}

/**
 * ローカルストレージから日付範囲の部位情報を取得する
 * @param startDate 開始日
 * @param endDate 終了日
 * @param exercises 種目一覧（種目IDから部位を取得するため）
 * @returns 日付文字列をキー、部位配列を値とするオブジェクト
 */
export function getBodyPartsByDateRangeFromStorage({
  startDate,
  endDate,
  exercises,
}: {
  startDate: Date;
  endDate: Date;
  exercises: Exercise[];
}): Record<string, BodyPart[]> {
  if (typeof window === "undefined") return {};

  const bodyPartsByDate: Record<string, Set<BodyPart>> = {};

  // 種目ID → 部位のマップを作成
  const exerciseIdToBodyPart = new Map<string, BodyPart>();
  exercises.forEach((ex) => {
    exerciseIdToBodyPart.set(ex.id, ex.bodyPart);
  });

  // 種目IDから部位を取得する補助関数
  // カスタム種目の場合、exercises配列に含まれていない可能性があるため、
  // 見つからない場合はデフォルトで"other"を返す
  const getBodyPartForExercise = (exerciseId: string): BodyPart => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    return exercise?.bodyPart ?? "other";
  };

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // workout_* または cardio_* キーを処理
      const parsed = parseStorageKey(key);
      if (!parsed) continue;

      const { dateStr, exerciseId, type } = parsed;

      // 日付範囲内かチェック
      const recordDate = new Date(dateStr + "T00:00:00");
      if (isNaN(recordDate.getTime())) continue;
      if (isBefore(recordDate, startDate) || isAfter(recordDate, endDate)) {
        continue;
      }

      // 種目IDから部位を取得
      const bodyPart =
        exerciseIdToBodyPart.get(exerciseId) ??
        getBodyPartForExercise(exerciseId);

      // データが有効かチェック
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const isValid =
          type === "workout"
            ? isValidSets(JSON.parse(stored) as SetRecord[])
            : isValidCardioRecords(JSON.parse(stored) as CardioRecord[]);

        if (isValid) {
          // 日付ごとの部位セットを初期化（必要に応じて）
          if (!bodyPartsByDate[dateStr]) {
            bodyPartsByDate[dateStr] = new Set();
          }
          bodyPartsByDate[dateStr].add(bodyPart);
        }
      } catch (error) {
        console.warn(`Failed to parse ${type} records for key ${key}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error("Failed to get body parts from storage:", error);
  }

  // Setを配列に変換
  const result: Record<string, BodyPart[]> = {};
  Object.keys(bodyPartsByDate).forEach((date) => {
    result[date] = Array.from(bodyPartsByDate[date]);
  });

  return result;
}
