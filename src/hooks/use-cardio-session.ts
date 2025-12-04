"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { CardioRecord } from "@/types/workout";
import {
  saveWorkoutSession,
  getWorkoutSession,
  saveCardioRecords as saveCardioRecordsToAPI,
  getCardioRecords as getCardioRecordsFromAPI,
} from "@/lib/api";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useAuthSession } from "@/lib/auth-session-context";

const getStorageKey = (date: Date, exerciseId: string): string => {
  const dateStr = formatDateToYYYYMMDD(date);
  return `cardio_${dateStr}_${exerciseId}`;
};

const loadCardioRecordsFromStorage = (
  date: Date,
  exerciseId: string
): CardioRecord[] | null => {
  if (typeof window === "undefined") return null;

  try {
    const key = getStorageKey(date, exerciseId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as CardioRecord[];
    return parsed.map((record) => ({
      ...record,
      date: new Date(record.date),
    }));
  } catch (error) {
    console.error("Failed to load cardio records from storage:", error);
    return null;
  }
};

export const saveCardioRecordsToStorage = (
  date: Date,
  exerciseId: string,
  records: CardioRecord[]
): void => {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(date, exerciseId);
    const hasValidData = records.some(
      (record) =>
        record.duration > 0 ||
        (record.distance ?? 0) > 0 ||
        (record.calories ?? 0) > 0
    );
    if (hasValidData) {
      localStorage.setItem(key, JSON.stringify(records));
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Failed to save cardio records to storage:", error);
  }
};

const removeCardioRecordsFromStorage = (
  date: Date,
  exerciseId: string
): void => {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(date, exerciseId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove cardio records from storage:", error);
  }
};

interface UseCardioSessionOptions {
  date: Date;
  exerciseId: string | null;
  isOpen: boolean;
  createInitialRecord?: () => CardioRecord;
}

export function useCardioSession({
  date,
  exerciseId,
  isOpen,
  createInitialRecord,
}: UseCardioSessionOptions) {
  const { userId } = useAuthSession();

  const [records, setRecords] = useState<CardioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const previousDateRef = useRef<Date>(date);
  const previousExerciseIdRef = useRef<string | null>(exerciseId);

  const dateStr = useMemo(() => formatDateToYYYYMMDD(date), [date]);

  const updateRecords = useCallback(
    (
      newRecords: CardioRecord[] | ((prev: CardioRecord[]) => CardioRecord[])
    ) => {
      setRecords((prevRecords) => {
        const updatedRecords =
          typeof newRecords === "function"
            ? newRecords(prevRecords)
            : newRecords;

        if (exerciseId) {
          saveCardioRecordsToStorage(date, exerciseId, updatedRecords);
        }

        return updatedRecords;
      });
    },
    [date, exerciseId]
  );

  const loadRecords = useCallback(async () => {
    if (!exerciseId || !isOpen) {
      setRecords([]);
      return;
    }

    setIsLoading(true);

    // 修正: userIdがある場合（ログイン時）のみDBから取得を試みる
    if (userId) {
      try {
        const currentDateStr = formatDateToYYYYMMDD(date);
        const sessionResult = await getWorkoutSession(userId, currentDateStr);

        if (sessionResult.success && sessionResult.data) {
          const recordsResult = await getCardioRecordsFromAPI(userId, {
            sessionId: sessionResult.data.id,
            exerciseId,
          });

          if (
            recordsResult.success &&
            recordsResult.data &&
            recordsResult.data.length > 0
          ) {
            setRecords(recordsResult.data);
            saveCardioRecordsToStorage(date, exerciseId, recordsResult.data);
            setIsLoading(false);
            setIsLoaded(true);
            return;
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "データベースからの取得に失敗、ローカルストレージから取得:",
            error
          );
        }
      }
    }

    // ローカルストレージから取得（ゲスト、またはDB取得失敗時）
    const loaded = loadCardioRecordsFromStorage(date, exerciseId);
    if (loaded && loaded.length > 0) {
      setRecords(loaded);
    } else {
      if (createInitialRecord) {
        setRecords([createInitialRecord()]);
      } else {
        setRecords([]);
      }
    }

    setIsLoading(false);
    setIsLoaded(true);
  }, [date, exerciseId, isOpen, userId, createInitialRecord]);

  const saveRecords = useCallback(
    async (recordsToSave: CardioRecord[]) => {
      if (!exerciseId) return;

      // ローカルストレージに保存（常に実行）
      saveCardioRecordsToStorage(date, exerciseId, recordsToSave);

      // 修正: userIdがある場合（ログイン時）のみDBへ保存
      if (userId) {
        try {
          const currentDateStr = formatDateToYYYYMMDD(date);
          const sessionResult = await saveWorkoutSession(userId, {
            date: currentDateStr,
          });

          if (sessionResult.success && sessionResult.data) {
            await saveCardioRecordsToAPI(userId, {
              sessionId: sessionResult.data.id,
              exerciseId,
              records: recordsToSave,
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "データベースへの保存に失敗（ローカルストレージは保存済み）:",
              error
            );
          }
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("workout-record-updated", {
            detail: { exerciseId, date: formatDateToYYYYMMDD(date) },
          })
        );
      }
    },
    [date, exerciseId, userId]
  );

  const removeRecords = useCallback(() => {
    if (!exerciseId) return;
    removeCardioRecordsFromStorage(date, exerciseId);
    setRecords([]);
  }, [date, exerciseId]);

  const recordsRef = useRef<CardioRecord[]>(records);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  // 日付や種目が変わった際の自動保存
  useEffect(() => {
    const dateChanged = previousDateRef.current.getTime() !== date.getTime();
    const exerciseChanged = previousExerciseIdRef.current !== exerciseId;

    if (
      (dateChanged || exerciseChanged) &&
      isOpen &&
      previousExerciseIdRef.current &&
      recordsRef.current.length > 0
    ) {
      saveCardioRecordsToStorage(
        previousDateRef.current,
        previousExerciseIdRef.current,
        recordsRef.current
      );

      // 修正: userIdがある場合（ログイン時）のみDBへ保存
      if (userId) {
        (async () => {
          try {
            const previousDateStr = formatDateToYYYYMMDD(
              previousDateRef.current
            );
            const sessionResult = await saveWorkoutSession(userId, {
              date: previousDateStr,
            });

            if (
              sessionResult.success &&
              sessionResult.data &&
              previousExerciseIdRef.current
            ) {
              await saveCardioRecordsToAPI(userId, {
                sessionId: sessionResult.data.id,
                exerciseId: previousExerciseIdRef.current,
                records: recordsRef.current,
              });
            }
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              console.warn("日付変更時のデータベース保存に失敗:", error);
            }
          }
        })();
      }
    }

    previousDateRef.current = date;
    previousExerciseIdRef.current = exerciseId;
  }, [date, exerciseId, isOpen, userId]);

  useEffect(() => {
    if (isOpen && exerciseId) {
      loadRecords();
    } else if (!isOpen) {
      setRecords([]);
      setIsLoaded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, exerciseId, dateStr]);

  return {
    records,
    setRecords: updateRecords,
    isLoading,
    saveRecords,
    removeRecords,
    loadRecords,
    isLoaded,
  };
}
