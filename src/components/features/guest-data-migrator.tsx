"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { useAuthSession } from "@/lib/auth-session-context";
import { parseStorageKey } from "@/lib/local-storage-history";
import { getSessionDetailsFromStorage } from "@/lib/local-storage-session-details";
import { loadExercisesFromStorage } from "@/lib/local-storage-exercises";
import {
  getExercises,
  saveWorkoutSession,
  saveSets,
  saveCardioRecords,
  getSessionDetails,
} from "@/lib/api";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";

const GUEST_DATA_MIGRATED_KEY = "guest_data_migrated";

export function GuestDataMigrator() {
  const { userId } = useAuthSession(); // 🔥 ここを変更
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!userId) return; // 🔥 userId がない = 未ログイン
    if (hasStartedRef.current) return;
    if (typeof window === "undefined") return;

    const migratedFlag = window.localStorage.getItem(GUEST_DATA_MIGRATED_KEY);
    if (migratedFlag === "true") {
      hasStartedRef.current = true;
      return;
    }

    hasStartedRef.current = true;

    (async () => {
      await migrateGuestData(userId);
    })().catch((error) => {
      console.error("ゲストデータ移行中にエラー:", error);
    });
  }, [userId]);

  return null;
}

/**
 * 種目名と部位からマップ用のキーを生成する
 */
function createNameBodyPartKey(
  name: string,
  bodyPart: Exercise["bodyPart"]
): string {
  return `${name}__${bodyPart}`;
}

/**
 * ローカルストレージから記録が存在する日付一覧を収集する
 */
function collectRecordedDatesFromStorage(): string[] {
  if (typeof window === "undefined") return [];

  const dates = new Set<string>();

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      const parsed = parseStorageKey(key);
      if (!parsed) continue;

      dates.add(parsed.dateStr);
    }
  } catch (error) {
    console.error(
      "ローカルストレージから日付一覧を取得中にエラーが発生しました:",
      error
    );
  }

  return Array.from(dates).sort();
}

/**
 * 種目IDマッピング用のデータ構造を作成する
 */
function createExerciseMappingData(
  localExercises: Exercise[],
  dbExercises: Exercise[]
): {
  localExerciseById: Map<string, Exercise>;
  dbExerciseIds: Set<string>;
  dbExerciseIdByNameAndBodyPart: Map<string, string>;
} {
  // ローカル種目ID -> 種目情報のマップ
  const localExerciseById = new Map<string, Exercise>();
  localExercises.forEach((ex) => {
    localExerciseById.set(ex.id, ex);
  });

  // DB種目IDセットと (name, bodyPart) -> ID のマップ
  const dbExerciseIds = new Set<string>();
  const dbExerciseIdByNameAndBodyPart = new Map<string, string>();

  dbExercises.forEach((ex) => {
    dbExerciseIds.add(ex.id);
    const key = createNameBodyPartKey(ex.name, ex.bodyPart);
    if (!dbExerciseIdByNameAndBodyPart.has(key)) {
      dbExerciseIdByNameAndBodyPart.set(key, ex.id);
    }
  });

  return {
    localExerciseById,
    dbExerciseIds,
    dbExerciseIdByNameAndBodyPart,
  };
}

/**
 * ローカルの種目IDをDBの種目IDにマッピングする
 */
function createExerciseIdMapper(
  localExerciseById: Map<string, Exercise>,
  dbExerciseIds: Set<string>,
  dbExerciseIdByNameAndBodyPart: Map<string, string>,
  dbExercises: Exercise[]
): (localExerciseId: string) => string | null {
  return (localExerciseId: string): string | null => {
    // すでにDB由来のIDであれば、そのまま使えるか確認
    if (
      !localExerciseId.startsWith("mock-") &&
      dbExerciseIds.has(localExerciseId)
    ) {
      return localExerciseId;
    }

    const localExercise = localExerciseById.get(localExerciseId);
    if (!localExercise) {
      // ローカル種目一覧に存在しないIDはマッピング不可
      return null;
    }

    // 名前＋部位でマッピング
    const key = createNameBodyPartKey(
      localExercise.name,
      localExercise.bodyPart
    );
    const mappedId = dbExerciseIdByNameAndBodyPart.get(key);
    if (mappedId) {
      return mappedId;
    }

    // 部位が変わっている可能性も考慮し、名前だけで最初に一致したものをフォールバックとして使用
    const fallback = dbExercises.find((ex) => ex.name === localExercise.name);
    return fallback ? fallback.id : null;
  };
}

/**
 * 既存のDB記録から種目IDセットを取得する
 */
async function getExistingExerciseIds(
  userId: string,
  sessionId: string
): Promise<{
  workoutExerciseIds: Set<string>;
  cardioExerciseIds: Set<string>;
}> {
  const existingWorkoutExerciseIds = new Set<string>();
  const existingCardioExerciseIds = new Set<string>();

  const existingDetailsResult = await getSessionDetails(userId, sessionId);
  if (existingDetailsResult.success && existingDetailsResult.data) {
    existingDetailsResult.data.workoutExercises.forEach(({ exerciseId }) => {
      existingWorkoutExerciseIds.add(exerciseId);
    });
    existingDetailsResult.data.cardioExercises.forEach(({ exerciseId }) => {
      existingCardioExerciseIds.add(exerciseId);
    });
  }

  return {
    workoutExerciseIds: existingWorkoutExerciseIds,
    cardioExerciseIds: existingCardioExerciseIds,
  };
}

/**
 * 1日分の記録を移行する
 */
async function migrateDateRecords(
  userId: string,
  dateStr: string,
  mapExerciseId: (localExerciseId: string) => string | null,
  workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>,
  cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>
): Promise<boolean> {
  try {
    // セッションを保存/取得
    const sessionResult = await saveWorkoutSession(userId, {
      date: dateStr,
    });

    if (!sessionResult.success || !sessionResult.data) {
      return false;
    }

    const sessionId = sessionResult.data.id;

    // 既存のDB記録を取得し、同じ日付・種目があればスキップするためのセットを作成
    const { workoutExerciseIds, cardioExerciseIds } =
      await getExistingExerciseIds(userId, sessionId);

    // 筋トレ記録の移行
    for (const { exerciseId: localExerciseId, sets } of workoutExercises) {
      const mappedExerciseId = mapExerciseId(localExerciseId);
      if (!mappedExerciseId) {
        continue;
      }

      // 既にDBに記録がある場合はDBを優先し、ローカル分は無視
      if (workoutExerciseIds.has(mappedExerciseId)) {
        continue;
      }

      const saveResult = await saveSets(userId, {
        sessionId,
        exerciseId: mappedExerciseId,
        sets,
      });

      if (!saveResult.success) {
        return false;
      }
    }

    // 有酸素記録の移行
    for (const { exerciseId: localExerciseId, records } of cardioExercises) {
      const mappedExerciseId = mapExerciseId(localExerciseId);
      if (!mappedExerciseId) {
        continue;
      }

      if (cardioExerciseIds.has(mappedExerciseId)) {
        continue;
      }

      const saveResult = await saveCardioRecords(userId, {
        sessionId,
        exerciseId: mappedExerciseId,
        records,
      });

      if (!saveResult.success) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("ゲストデータ移行中の保存エラー:", error);
    return false;
  }
}

/**
 * ローカルストレージのゲスト記録をデータベースへ移行する
 */
async function migrateGuestData(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // ローカルの種目一覧を取得（mock-* ID を含む）
    const localExercises = loadExercisesFromStorage();
    if (localExercises.length === 0) {
      // 記録用種目がなければ何もせずに終了
      window.localStorage.setItem(GUEST_DATA_MIGRATED_KEY, "true");
      return;
    }

    // データベースの種目一覧を取得
    const exercisesResult = await getExercises(userId);
    const dbExercises: Exercise[] =
      exercisesResult.success && exercisesResult.data
        ? exercisesResult.data
        : [];

    if (dbExercises.length === 0) {
      // DB側に種目がない場合は移行しても保存できないため、何もせずに終了
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "ゲストデータ移行をスキップしました。データベースに種目マスタが存在しません。"
        );
      }
      return;
    }

    // 種目IDマッピング用のデータ構造を作成
    const { localExerciseById, dbExerciseIds, dbExerciseIdByNameAndBodyPart } =
      createExerciseMappingData(localExercises, dbExercises);

    // ローカルの種目IDをDBの種目IDにマッピングするヘルパー
    const mapExerciseId = createExerciseIdMapper(
      localExerciseById,
      dbExerciseIds,
      dbExerciseIdByNameAndBodyPart,
      dbExercises
    );

    // ローカルストレージ内の全キーから、記録が存在する日付一覧を取得
    const dates = collectRecordedDatesFromStorage();
    if (dates.length === 0) {
      // 記録がなければ種目だけの問題なので、モック種目を上書きするためにフラグだけ立てる
      window.localStorage.setItem(GUEST_DATA_MIGRATED_KEY, "true");
      return;
    }

    let hadError = false;

    for (const dateStr of dates) {
      const date = new Date(`${dateStr}T00:00:00`);

      // ローカルのセッション詳細を取得
      const { workoutExercises, cardioExercises } =
        getSessionDetailsFromStorage({
          date,
        });

      if (workoutExercises.length === 0 && cardioExercises.length === 0) {
        continue;
      }

      const yyyyMMdd = format(date, "yyyy-MM-dd");

      // 1日分の記録を移行
      const success = await migrateDateRecords(
        userId,
        yyyyMMdd,
        mapExerciseId,
        workoutExercises,
        cardioExercises
      );

      if (!success) {
        hadError = true;
      }
    }

    // エラーがなければ、対象のローカルストレージキーをクリーンアップしてフラグを立てる
    if (!hadError) {
      cleanupGuestLocalStorage();
      window.localStorage.setItem(GUEST_DATA_MIGRATED_KEY, "true");
    } else if (process.env.NODE_ENV === "development") {
      console.warn(
        "ゲストデータ移行は一部エラーにより完了していません。ローカルデータは保持されています。"
      );
    }
  } catch (error) {
    console.error("ゲストデータ移行処理でエラーが発生しました:", error);
  }
}

/**
 * ゲスト時代の記録に関連するローカルストレージのキーをクリーンアップする
 */
function cleanupGuestLocalStorage(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      if (
        key.startsWith("workout_") ||
        key.startsWith("cardio_") ||
        key === "exercises"
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (error) {
    console.error(
      "ゲストデータ移行後のローカルストレージクリーンアップ中にエラー:",
      error
    );
  }
}
