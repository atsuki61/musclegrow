"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { SetRecord } from "@/types/workout";
import {
  saveWorkoutSession,
  getWorkoutSession,
  saveSets as saveSetsToAPI,
  getSets as getSetsFromAPI,
} from "@/lib/api";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useAuthSession } from "@/lib/auth-session-context";

/**
 * ローカルストレージのキーを生成
 */
const getStorageKey = (date: Date, exerciseId: string): string => {
  const dateStr = formatDateToYYYYMMDD(date);
  return `workout_${dateStr}_${exerciseId}`;
};

/**
 * ローカルストレージからセット記録を取得
 */
const loadSetsFromStorage = (
  date: Date,
  exerciseId: string
): SetRecord[] | null => {
  if (typeof window === "undefined") return null;

  try {
    const key = getStorageKey(date, exerciseId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as SetRecord[];
    return parsed;
  } catch (error) {
    console.error("Failed to load sets from storage:", error);
    return null;
  }
};

/**
 * ローカルストレージにセット記録を保存
 */
export const saveSetsToStorage = (
  date: Date,
  exerciseId: string,
  sets: SetRecord[]
): void => {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(date, exerciseId);
    const hasValidData = sets.some(
      (set) => (set.weight ?? 0) > 0 || set.reps > 0 || (set.duration ?? 0) > 0
    );
    if (hasValidData) {
      localStorage.setItem(key, JSON.stringify(sets));
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Failed to save sets to storage:", error);
  }
};

/**
 * ローカルストレージからセット記録を削除
 */
const removeSetsFromStorage = (date: Date, exerciseId: string): void => {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(date, exerciseId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove sets from storage:", error);
  }
};

interface UseWorkoutSessionOptions {
  date: Date;
  exerciseId: string | null;
  isOpen: boolean;
  createInitialSet?: () => SetRecord;
}

export function useWorkoutSession({
  date,
  exerciseId,
  isOpen,
  createInitialSet,
}: UseWorkoutSessionOptions) {
  const { userId } = useAuthSession();

  // ▼ 修正: 初期値は空配列（同期的なlocalStorageアクセスを避けるため）
  const [sets, setSets] = useState<SetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const previousDateRef = useRef<Date>(date);
  const previousExerciseIdRef = useRef<string | null>(exerciseId);

  const dateStr = useMemo(() => formatDateToYYYYMMDD(date), [date]);

  const updateSets = useCallback(
    (newSets: SetRecord[] | ((prev: SetRecord[]) => SetRecord[])) => {
      setSets((prevSets) => {
        const updatedSets =
          typeof newSets === "function" ? newSets(prevSets) : newSets;

        if (exerciseId) {
          saveSetsToStorage(date, exerciseId, updatedSets);
        }

        return updatedSets;
      });
    },
    [date, exerciseId]
  );

  const loadSets = useCallback(async () => {
    if (!exerciseId || !isOpen) {
      setSets([]);
      return;
    }

    setIsLoading(true);

    try {
      const dateStr = formatDateToYYYYMMDD(date);
      const sessionResult = await getWorkoutSession(userId, dateStr);

      if (sessionResult.success && sessionResult.data) {
        const setsResult = await getSetsFromAPI(userId, {
          sessionId: sessionResult.data.id,
          exerciseId,
        });

        if (
          setsResult.success &&
          setsResult.data &&
          setsResult.data.length > 0
        ) {
          setSets(setsResult.data);
          saveSetsToStorage(date, exerciseId, setsResult.data);
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

    const loaded = loadSetsFromStorage(date, exerciseId);
    if (loaded && loaded.length > 0) {
      setSets(loaded);
    } else {
      // ▼ 修正: データがない場合、初期セット作成関数があればそれを使う
      if (createInitialSet) {
        setSets([createInitialSet()]);
      } else {
        setSets([]);
      }
    }

    setIsLoading(false);
    setIsLoaded(true);
  }, [date, exerciseId, isOpen, userId, createInitialSet]); // 依存配列に追加

  const saveSets = useCallback(
    async (setsToSave: SetRecord[]) => {
      if (!exerciseId) return;

      saveSetsToStorage(date, exerciseId, setsToSave);

      try {
        const dateStr = formatDateToYYYYMMDD(date);
        const sessionResult = await saveWorkoutSession(userId, {
          date: dateStr,
        });

        if (sessionResult.success && sessionResult.data) {
          await saveSetsToAPI(userId, {
            sessionId: sessionResult.data.id,
            exerciseId,
            sets: setsToSave,
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

  const removeSets = useCallback(() => {
    if (!exerciseId) return;
    removeSetsFromStorage(date, exerciseId);
    setSets([]);
  }, [date, exerciseId]);

  const setsRef = useRef<SetRecord[]>(sets);

  useEffect(() => {
    setsRef.current = sets;
  }, [sets]);

  useEffect(() => {
    const dateChanged = previousDateRef.current.getTime() !== date.getTime();
    const exerciseChanged = previousExerciseIdRef.current !== exerciseId;

    if (
      (dateChanged || exerciseChanged) &&
      isOpen &&
      previousExerciseIdRef.current &&
      setsRef.current.length > 0
    ) {
      saveSetsToStorage(
        previousDateRef.current,
        previousExerciseIdRef.current,
        setsRef.current
      );

      (async () => {
        try {
          const previousDateStr = formatDateToYYYYMMDD(previousDateRef.current);
          const sessionResult = await saveWorkoutSession(userId, {
            date: previousDateStr,
          });

          if (sessionResult.success && sessionResult.data) {
            await saveSetsToAPI(userId, {
              sessionId: sessionResult.data.id,
              exerciseId: previousExerciseIdRef.current!,
              sets: setsRef.current,
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("日付変更時のデータベース保存に失敗:", error);
          }
        }
      })();
    }

    previousDateRef.current = date;
    previousExerciseIdRef.current = exerciseId;
  }, [date, exerciseId, isOpen, userId]);

  useEffect(() => {
    if (isOpen && exerciseId) {
      loadSets();
    } else if (!isOpen) {
      setSets([]);
      setIsLoaded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, exerciseId, dateStr]);

  return {
    sets,
    setSets: updateSets,
    isLoading,
    saveSets,
    removeSets,
    loadSets,
    isLoaded, // 追加
  };
}
