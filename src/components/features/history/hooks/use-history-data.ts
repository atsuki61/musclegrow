import { useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  getSessionDetails,
  getWorkoutSession,
  getBodyPartsByDateRange,
} from "@/lib/api";
import { getBodyPartsByDateRangeFromStorage } from "@/lib/local-storage-history";
import { getSessionDetailsFromStorage } from "@/lib/local-storage-session-details";
import type {
  Exercise,
  BodyPart,
  SetRecord,
  CardioRecord,
} from "@/types/workout";
import type { SessionDetails } from "../types";

export type { SessionDetails } from "../types";

interface UseHistoryDataOptions {
  initialBodyPartsByDate?: Record<string, BodyPart[]>;
  initialSessionDetails?: SessionDetails | null;
}

/**
 * データベースとローカルストレージの部位データをマージ
 */
function mergeBodyParts(
  dbBodyParts: Record<string, BodyPart[]>,
  storageBodyParts: Record<string, BodyPart[]>
): Record<string, BodyPart[]> {
  const merged: Record<string, BodyPart[]> = { ...dbBodyParts };
  Object.keys(storageBodyParts).forEach((date) => {
    if (merged[date]) {
      const existingSet = new Set(merged[date]);
      storageBodyParts[date].forEach((part) => existingSet.add(part));
      merged[date] = Array.from(existingSet);
    } else {
      merged[date] = storageBodyParts[date];
    }
  });
  return merged;
}

/**
 * データベースとローカルストレージのセッション詳細をマージ
 */
function mergeSessionDetails(
  dbDetails: {
    workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
    cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
  } | null,
  storageDetails: {
    workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
    cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
  }
): SessionDetails | null {
  const workoutExercisesMap = new Map<string, SetRecord[]>();
  const cardioExercisesMap = new Map<string, CardioRecord[]>();

  // データベースの結果を追加
  if (dbDetails) {
    dbDetails.workoutExercises.forEach(({ exerciseId, sets }) => {
      workoutExercisesMap.set(exerciseId, sets);
    });
    dbDetails.cardioExercises.forEach(({ exerciseId, records }) => {
      cardioExercisesMap.set(exerciseId, records);
    });
  }

  // ローカルストレージの結果を追加（データベースにない種目のみ）
  storageDetails.workoutExercises.forEach(({ exerciseId, sets }) => {
    if (!workoutExercisesMap.has(exerciseId)) {
      workoutExercisesMap.set(exerciseId, sets);
    }
  });
  storageDetails.cardioExercises.forEach(({ exerciseId, records }) => {
    if (!cardioExercisesMap.has(exerciseId)) {
      cardioExercisesMap.set(exerciseId, records);
    }
  });

  const mergedWorkoutExercises = Array.from(workoutExercisesMap.entries()).map(
    ([exerciseId, sets]) => ({ exerciseId, sets })
  );
  const mergedCardioExercises = Array.from(cardioExercisesMap.entries()).map(
    ([exerciseId, records]) => ({ exerciseId, records })
  );

  // どちらか一方でもデータがあれば返す
  if (mergedWorkoutExercises.length > 0 || mergedCardioExercises.length > 0) {
    return {
      workoutExercises: mergedWorkoutExercises,
      cardioExercises: mergedCardioExercises,
      date: new Date(), // 実際の日付は呼び出し側で設定
      durationMinutes: null,
      note: null,
    };
  }

  return null;
}

/**
 * 履歴データを管理するカスタムフック
 */
export function useHistoryData(
  exercises: Exercise[],
  options?: UseHistoryDataOptions
) {
  const [bodyPartsByDate, setBodyPartsByDate] = useState<
    Record<string, BodyPart[]>
  >(options?.initialBodyPartsByDate ?? {});
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(
    options?.initialSessionDetails ?? null
  );
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 日付ごとの部位一覧を取得（データベース + ローカルストレージ）
   */
  const loadBodyPartsByDate = useCallback(
    async (currentMonth: Date) => {
      try {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const monthRange = {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
        };

        // データベースから取得
        const dbResult = await getBodyPartsByDateRange(monthRange);
        const dbBodyParts = dbResult.success ? dbResult.data || {} : {};

        // ローカルストレージから取得
        const startDate = new Date(monthRange.startDate + "T00:00:00");
        const endDate = new Date(monthRange.endDate + "T23:59:59");
        const storageBodyParts = getBodyPartsByDateRangeFromStorage({
          startDate,
          endDate,
          exercises,
        });

        // マージ
        const merged = mergeBodyParts(dbBodyParts, storageBodyParts);
        setBodyPartsByDate(merged);
      } catch (error) {
        console.error("部位一覧取得エラー:", error);
      }
    },
    [exercises]
  );

  /**
   * 選択された日付のセッション詳細を取得（データベース + ローカルストレージ）
   */
  const loadSessionDetails = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");

      // データベースとローカルストレージを並列に取得
      const [sessionResult, storageDetails] = await Promise.all([
        getWorkoutSession(dateStr),
        Promise.resolve(getSessionDetailsFromStorage({ date })),
      ]);
      let dbDetails: {
        workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
        cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
      } | null = null;
      let dbNote: string | null | undefined = null;
      let dbDurationMinutes: number | null | undefined = null;

      if (sessionResult.success && sessionResult.data) {
        const detailsResult = await getSessionDetails(sessionResult.data.id);
        if (detailsResult.success && detailsResult.data) {
          dbDetails = detailsResult.data;
          dbNote = sessionResult.data.note;
          dbDurationMinutes = sessionResult.data.durationMinutes;
        }
      }

      // マージ
      const merged = mergeSessionDetails(dbDetails, storageDetails);

      if (merged) {
        setSessionDetails({
          ...merged,
          date,
          durationMinutes: dbDurationMinutes,
          note: dbNote,
        });
      } else {
        setSessionDetails(null);
      }
    } catch (error) {
      console.error("セッション詳細取得エラー:", error);
      setSessionDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bodyPartsByDate,
    sessionDetails,
    isLoading,
    loadBodyPartsByDate,
    loadSessionDetails,
    setSessionDetails,
  };
}
