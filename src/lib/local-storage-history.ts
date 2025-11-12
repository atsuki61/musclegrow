"use client";

import { format } from "date-fns";
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
 * 種目IDから部位を取得するマップを作成する
 * @param exercises 種目一覧
 * @returns 種目IDをキー、部位を値とするマップ
 */
function createExerciseIdToBodyPartMap(
  exercises: Exercise[]
): Map<string, BodyPart> {
  const exerciseIdToBodyPart = new Map<string, BodyPart>();
  exercises.forEach((exercise) => {
    exerciseIdToBodyPart.set(exercise.id, exercise.bodyPart);
  });
  return exerciseIdToBodyPart;
}

/**
 * 種目IDから部位を取得する
 * カスタム種目の場合、exercises配列に含まれていない可能性があるため、
 * 見つからない場合はデフォルトで"other"を返す
 * @param exerciseId 種目ID
 * @param exerciseIdToBodyPart 種目ID→部位のマップ
 * @param exercises 種目一覧（フォールバック用）
 * @returns 部位
 */
function getBodyPartForExercise(
  exerciseId: string,
  exerciseIdToBodyPart: Map<string, BodyPart>,
  exercises: Exercise[]
): BodyPart {
  return (
    exerciseIdToBodyPart.get(exerciseId) ??
    exercises.find((e) => e.id === exerciseId)?.bodyPart ??
    "other"
  );
}

/**
 * 日付が指定範囲内かチェックする
 * タイムゾーンの問題を回避するため、文字列比較を使用
 * @param dateStr YYYY-MM-DD形式の日付文字列
 * @param startDate 開始日
 * @param endDate 終了日
 * @returns 範囲内の場合true
 */
function isDateInRange(
  dateStr: string,
  startDate: Date,
  endDate: Date
): boolean {
  // 日付文字列を直接比較（タイムゾーン問題を回避）
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  // 文字列比較で範囲チェック
  return dateStr >= startDateStr && dateStr <= endDateStr;
}

/**
 * 記録が有効かチェックする
 * @param storedValue ローカルストレージから取得したJSON文字列
 * @param type 記録タイプ（workout または cardio）
 * @returns 有効な場合true
 */
function isValidRecord(
  storedValue: string,
  type: "workout" | "cardio"
): boolean {
  try {
    if (type === "workout") {
      const sets = JSON.parse(storedValue) as SetRecord[];
      return isValidSets(sets);
    } else {
      const records = JSON.parse(storedValue) as CardioRecord[];
      return isValidCardioRecords(records);
    }
  } catch (error) {
    console.warn(`Failed to parse ${type} record:`, error);
    return false;
  }
}

/**
 * ローカルストレージのキーから部位情報を取得して追加する
 * @param key ローカルストレージのキー
 * @param startDate 開始日
 * @param endDate 終了日
 * @param exerciseIdToBodyPart 種目ID→部位のマップ
 * @param exercises 種目一覧（フォールバック用）
 * @param bodyPartsByDate 日付ごとの部位セット（更新される）
 */
function processStorageKeyForBodyParts(
  key: string,
  startDate: Date,
  endDate: Date,
  exerciseIdToBodyPart: Map<string, BodyPart>,
  exercises: Exercise[],
  bodyPartsByDate: Record<string, Set<BodyPart>>
): void {
  // キーを解析（日付、種目ID、タイプを取得）
  const keyInfo = parseStorageKey(key);
  if (!keyInfo) {
    return; // 無効なキーはスキップ
  }

  const { dateStr, exerciseId, type } = keyInfo;

  // 日付範囲内かチェック
  if (!isDateInRange(dateStr, startDate, endDate)) {
    return;
  }

  // 種目IDから部位を取得
  const bodyPart = getBodyPartForExercise(
    exerciseId,
    exerciseIdToBodyPart,
    exercises
  );

  // データが有効かチェック
  const storedValue = localStorage.getItem(key);
  if (!storedValue) {
    return;
  }

  if (!isValidRecord(storedValue, type)) {
    return;
  }

  // 日付ごとの部位セットを初期化（必要に応じて）
  if (!bodyPartsByDate[dateStr]) {
    bodyPartsByDate[dateStr] = new Set();
  }
  bodyPartsByDate[dateStr].add(bodyPart);
}

/**
 * Setを配列に変換する
 * @param bodyPartsByDate 日付ごとの部位セット
 * @returns 日付文字列をキー、部位配列を値とするオブジェクト
 */
function convertSetsToArrays(
  bodyPartsByDate: Record<string, Set<BodyPart>>
): Record<string, BodyPart[]> {
  const result: Record<string, BodyPart[]> = {};
  Object.keys(bodyPartsByDate).forEach((date) => {
    result[date] = Array.from(bodyPartsByDate[date]);
  });
  return result;
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
  if (typeof window === "undefined") {
    return {};
  }

  const bodyPartsByDate: Record<string, Set<BodyPart>> = {};
  const exerciseIdToBodyPart = createExerciseIdToBodyPartMap(exercises);

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) {
        continue;
      }

      processStorageKeyForBodyParts(
        key,
        startDate,
        endDate,
        exerciseIdToBodyPart,
        exercises,
        bodyPartsByDate
      );
    }
  } catch (error) {
    console.error("Failed to get body parts from storage:", error);
  }

  return convertSetsToArrays(bodyPartsByDate);
}
