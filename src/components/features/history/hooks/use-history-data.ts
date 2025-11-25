import { useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  getSessionDetails,
  getWorkoutSession,
  getBodyPartsByDateRange,
} from "@/lib/api";
import { getBodyPartsByDateRangeFromStorage } from "@/lib/local-storage-history";
import { getSessionDetailsFromStorage } from "@/lib/local-storage-session-details";
import { shouldUseDbOnly } from "@/lib/data-source";
import type {
  Exercise,
  BodyPart,
  SetRecord,
  CardioRecord,
} from "@/types/workout";
import type { SessionDetails } from "../types";

interface UseHistoryDataOptions {
  initialBodyPartsByDate?: Record<string, BodyPart[]>;
  initialSessionDetails?: SessionDetails | null;
}

/**
 * データベースとローカルストレージの部位データをマージ
 * useMemo 化のため pure function にして維持
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
 * セッション詳細のマージ（pure function）
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

  // DB のデータ
  if (dbDetails) {
    dbDetails.workoutExercises.forEach(({ exerciseId, sets }) => {
      workoutExercisesMap.set(exerciseId, sets);
    });
    dbDetails.cardioExercises.forEach(({ exerciseId, records }) => {
      cardioExercisesMap.set(exerciseId, records);
    });
  }

  // localStorage のデータ（DB に無いものだけ）
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

  if (mergedWorkoutExercises.length > 0 || mergedCardioExercises.length > 0) {
    return {
      workoutExercises: mergedWorkoutExercises,
      cardioExercises: mergedCardioExercises,
      date: new Date(),
      durationMinutes: null,
      note: null,
    };
  }

  return null;
}

/**
 * 履歴データを管理するカスタムフック（最適化済み）
 */
export function useHistoryData(
  exercises: Exercise[],
  userId: string,
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
   * 月の部位データ取得
   */
  const loadBodyPartsByDate = useCallback(
    async (currentMonth: Date) => {
      try {
        // DBのみ参照すべきか判定（ログイン済み＋移行完了の場合true）
        const useDbOnly = shouldUseDbOnly(userId);

        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);

        const monthRange = {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
        };

        // APIから取得
        const dbResult = await getBodyPartsByDateRange(userId, monthRange);
        const dbBodyParts = dbResult.success ? dbResult.data ?? {} : {};

        if (useDbOnly) {
          // DBのみモード: ローカルストレージを参照しない（パフォーマンス向上）
          setBodyPartsByDate(dbBodyParts);
        } else {
          // 従来モード: ローカルストレージとマージ
          const storageBodyParts = getBodyPartsByDateRangeFromStorage({
            startDate: new Date(monthRange.startDate + "T00:00:00"),
            endDate: new Date(monthRange.endDate + "T23:59:59"),
          });
          const merged = mergeBodyParts(dbBodyParts, storageBodyParts);
          setBodyPartsByDate(merged);
        }
      } catch (e) {
        console.error("部位一覧取得エラー:", e);
      }
    },
    [userId]
  );

  /**
   * セッション詳細取得
   */
  const loadSessionDetails = useCallback(
    async (date: Date) => {
      setIsLoading(true);
      try {
        // DBのみ参照すべきか判定（ログイン済み＋移行完了の場合true）
        const useDbOnly = shouldUseDbOnly(userId);

        const dateStr = format(date, "yyyy-MM-dd");

        // DBから取得
        const sessionResult = await getWorkoutSession(userId, dateStr);

        let dbDetails = null;
        let dbNote: string | null = null;
        let dbDurationMinutes: number | null = null;

        if (sessionResult.success && sessionResult.data) {
          const details = await getSessionDetails(
            userId,
            sessionResult.data.id
          );

          if (details.success && details.data) {
            dbDetails = details.data;
            dbNote = sessionResult.data.note ?? null;
            dbDurationMinutes = sessionResult.data.durationMinutes ?? null;
          }
        }

        if (useDbOnly) {
          // DBのみモード: ローカルストレージを参照しない（パフォーマンス向上）
          if (dbDetails) {
            setSessionDetails({
              workoutExercises: dbDetails.workoutExercises,
              cardioExercises: dbDetails.cardioExercises,
              date,
              note: dbNote,
              durationMinutes: dbDurationMinutes,
            });
          } else {
            setSessionDetails(null);
          }
        } else {
          // 従来モード: ローカルストレージとマージ
          const storageDetails = getSessionDetailsFromStorage({ date });
          const merged = mergeSessionDetails(dbDetails, storageDetails);

          if (merged) {
            setSessionDetails({
              ...merged,
              date,
              note: dbNote,
              durationMinutes: dbDurationMinutes,
            });
          } else {
            setSessionDetails(null);
          }
        }
      } catch (e) {
        console.error("セッション詳細取得エラー:", e);
        setSessionDetails(null);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  return {
    bodyPartsByDate,
    sessionDetails,
    isLoading,
    loadBodyPartsByDate,
    loadSessionDetails,
    setSessionDetails,
  };
}
