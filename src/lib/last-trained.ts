"use client";

import type { BodyPart, Exercise } from "@/types/workout";
import type { SetRecord, CardioRecord } from "@/types/workout";

/**
 * ローカルストレージから各種目の最後のトレーニング日時を取得する
 * @returns 種目IDをキーとする最後のトレーニング日時のマップ
 */
export function getLastTrainedDates(): Record<string, Date> {
  if (typeof window === "undefined") return {};

  const lastTrainedDates: Record<string, Date> = {};

  try {
    // ローカルストレージの全てのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // workout_* または cardio_* キーを処理
      if (key.startsWith("workout_")) {
        // キー形式: workout_YYYY-MM-DD_exerciseId
        const parts = key.split("_");
        if (parts.length < 3) continue;

        const dateStr = parts[1]; // YYYY-MM-DD形式
        const exerciseId = parts.slice(2).join("_"); // exerciseIdにアンダースコアが含まれる可能性があるため

        try {
          const recordDate = new Date(dateStr + "T00:00:00");
          if (isNaN(recordDate.getTime())) continue;

          const stored = localStorage.getItem(key);
          if (!stored) continue;

          const sets = JSON.parse(stored) as SetRecord[];
          // 有効なデータがある場合のみ
          const hasValidData = sets.some(
            (set) =>
              (set.weight ?? 0) > 0 || set.reps > 0 || (set.duration ?? 0) > 0
          );

          if (hasValidData && sets.length > 0) {
            // 既存の日時と比較して、新しい方を保持
            if (
              !lastTrainedDates[exerciseId] ||
              recordDate > lastTrainedDates[exerciseId]
            ) {
              lastTrainedDates[exerciseId] = recordDate;
            }
          }
        } catch (error) {
          // 個別のキーのパースエラーは無視して続行
          console.warn(`Failed to parse workout record for key ${key}:`, error);
          continue;
        }
      } else if (key.startsWith("cardio_")) {
        // キー形式: cardio_YYYY-MM-DD_exerciseId
        const parts = key.split("_");
        if (parts.length < 3) continue;

        const dateStr = parts[1]; // YYYY-MM-DD形式
        const exerciseId = parts.slice(2).join("_");

        try {
          const recordDate = new Date(dateStr + "T00:00:00");
          if (isNaN(recordDate.getTime())) continue;

          const stored = localStorage.getItem(key);
          if (!stored) continue;

          const records = JSON.parse(stored) as CardioRecord[];
          // 有効なデータがある場合のみ
          const hasValidData = records.some(
            (record) =>
              record.duration > 0 ||
              (record.distance ?? 0) > 0 ||
              (record.calories ?? 0) > 0 ||
              (record.heartRate ?? 0) > 0
          );

          if (hasValidData && records.length > 0) {
            // 既存の日時と比較して、新しい方を保持
            if (
              !lastTrainedDates[exerciseId] ||
              recordDate > lastTrainedDates[exerciseId]
            ) {
              lastTrainedDates[exerciseId] = recordDate;
            }
          }
        } catch (error) {
          // 個別のキーのパースエラーは無視して続行
          console.warn(`Failed to parse cardio record for key ${key}:`, error);
          continue;
        }
      }
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

