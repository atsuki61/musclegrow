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
 * 日付と種目IDを組み合わせて一意のキーを作成
 * ローカルタイムゾーン（日本時間）で日付を取得
 */
const getStorageKey = (date: Date, exerciseId: string): string => {
  const dateStr = formatDateToYYYYMMDD(date); // YYYY-MM-DD形式（ローカルタイムゾーン）
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
 * 外部からも使用可能にするためエクスポート
 */
export const saveSetsToStorage = (
  date: Date,
  exerciseId: string,
  sets: SetRecord[]
): void => {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(date, exerciseId);
    // 空のセット（重量0、回数0、時間0のみ）は保存しない
    const hasValidData = sets.some(
      (set) => (set.weight ?? 0) > 0 || set.reps > 0 || (set.duration ?? 0) > 0
    );
    if (hasValidData) {
      localStorage.setItem(key, JSON.stringify(sets));
    } else {
      // 無効なデータの場合は削除
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
  /** 日付 */
  date: Date;
  /** 種目ID */
  exerciseId: string | null;
  /** モーダルが開いているかどうか */
  isOpen: boolean;
  /** 初期セットを作成する関数（オプション） */
  createInitialSet?: () => SetRecord;
}

/**
 * ワークアウトセッション管理フック
 * ローカルストレージを使用してセット記録を保存・読み込み
 */
export function useWorkoutSession({
  date,
  exerciseId,
  isOpen,
  createInitialSet,
}: UseWorkoutSessionOptions) {
  const { userId } = useAuthSession();
  const [sets, setSets] = useState<SetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 前回の日付と種目IDを追跡（日付変更時の自動保存用）
  const previousDateRef = useRef<Date>(date);
  const previousExerciseIdRef = useRef<string | null>(exerciseId);

  // 日付文字列をメモ化（useEffectの依存配列で使用）
  const dateStr = useMemo(() => formatDateToYYYYMMDD(date), [date]);

  /**
   * セットを更新し、ローカルストレージにも即座に保存する
   * この関数を使うことで、削除時にも確実にローカルストレージが更新される
   */
  const updateSets = useCallback(
    (newSets: SetRecord[] | ((prev: SetRecord[]) => SetRecord[])) => {
      setSets((prevSets) => {
        const updatedSets =
          typeof newSets === "function" ? newSets(prevSets) : newSets;

        // ローカルストレージに即座に保存
        if (exerciseId) {
          saveSetsToStorage(date, exerciseId, updatedSets);
        }

        return updatedSets;
      });
    },
    [date, exerciseId]
  );

  /**
   * セット記録を読み込む
   * データベースから取得を試み、失敗した場合はローカルストレージから取得
   */
  const loadSets = useCallback(async () => {
    if (!exerciseId || !isOpen) {
      setSets([]);
      return;
    }

    setIsLoading(true);

    // まずデータベースから取得を試みる
    try {
      const dateStr = formatDateToYYYYMMDD(date); // YYYY-MM-DD形式（ローカルタイムゾーン）
      const sessionResult = await getWorkoutSession(userId, dateStr);

      if (sessionResult.success && sessionResult.data) {
        // セッションが存在する場合、セット記録を取得
        const setsResult = await getSetsFromAPI(userId, {
          sessionId: sessionResult.data.id,
          exerciseId,
        });

        if (
          setsResult.success &&
          setsResult.data &&
          setsResult.data.length > 0
        ) {
          // データベースから取得できた場合
          setSets(setsResult.data);
          // ローカルストレージにも同期（オフライン対応）
          saveSetsToStorage(date, exerciseId, setsResult.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      // データベース取得エラーは無視してローカルストレージから取得
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "データベースからの取得に失敗、ローカルストレージから取得:",
          error
        );
      }
    }

    // データベースから取得できなかった場合、ローカルストレージから取得
    const loaded = loadSetsFromStorage(date, exerciseId);
    if (loaded && loaded.length > 0) {
      setSets(loaded);
    } else {
      // 保存済みデータがない場合、初期セットを作成（指定されている場合）
      if (createInitialSet) {
        setSets([createInitialSet()]);
      } else {
        setSets([]);
      }
    }
    setIsLoading(false);
  }, [date, exerciseId, isOpen, createInitialSet, userId]);

  /**
   * セット記録を保存する
   * ローカルストレージに即座に保存し、認証済みの場合はデータベースにも保存
   */
  const saveSets = useCallback(
    async (setsToSave: SetRecord[]) => {
      if (!exerciseId) return;

      // 1. ローカルストレージに即座に保存（既存の動作を維持）
      saveSetsToStorage(date, exerciseId, setsToSave);

      // 2. データベースにも保存を試みる（非同期、エラー時はログのみ）
      try {
        const dateStr = formatDateToYYYYMMDD(date); // YYYY-MM-DD形式（ローカルタイムゾーン）

        // セッションを保存または取得
        const sessionResult = await saveWorkoutSession(userId, {
          date: dateStr,
        });

        if (sessionResult.success && sessionResult.data) {
          // セット記録を保存
          await saveSetsToAPI(userId, {
            sessionId: sessionResult.data.id,
            exerciseId,
            sets: setsToSave,
          });
        }
      } catch (error) {
        // データベース保存エラーはログのみ（ローカルストレージは保存済み）
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "データベースへの保存に失敗（ローカルストレージは保存済み）:",
            error
          );
        }
      }

      // 3. 記録更新イベントを発行（グラフページなどで再取得をトリガー）
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("workout-record-updated", {
          detail: { exerciseId, date: formatDateToYYYYMMDD(date) },
        }));
      }
    },
    [date, exerciseId, userId]
  );

  /**
   * セット記録を削除する
   */
  const removeSets = useCallback(() => {
    if (!exerciseId) return;

    removeSetsFromStorage(date, exerciseId);
    setSets([]);
  }, [date, exerciseId]);

  // setsの最新値を保持するref（日付変更時の保存用）
  const setsRef = useRef<SetRecord[]>(sets);
  
  /**
   * 外部リソース（メモリ内のref）との同期
   * setsの最新値をrefに保持し、日付変更時の保存で使用
   */
  useEffect(() => {
    setsRef.current = sets;
  }, [sets]);

  /**
   * 外部リソース（ローカルストレージ、データベース）との同期
   * 日付または種目が変更された時に、前回のデータを自動保存
   */
  useEffect(() => {
    // 日付または種目が変更された場合
    const dateChanged = previousDateRef.current.getTime() !== date.getTime();
    const exerciseChanged = previousExerciseIdRef.current !== exerciseId;

    if (
      (dateChanged || exerciseChanged) &&
      isOpen &&
      previousExerciseIdRef.current &&
      setsRef.current.length > 0
    ) {
      // 前回の日付と種目IDでデータを保存（ローカルストレージ）
      saveSetsToStorage(
        previousDateRef.current,
        previousExerciseIdRef.current,
        setsRef.current
      );

      // データベースにも保存を試みる（非同期、エラー時はログのみ）
      // 前回の日付でセッションを取得または作成してから保存
      (async () => {
        try {
          const previousDateStr = formatDateToYYYYMMDD(previousDateRef.current); // YYYY-MM-DD形式（ローカルタイムゾーン）
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

    // 参照を更新
    previousDateRef.current = date;
    previousExerciseIdRef.current = exerciseId;
  }, [date, exerciseId, isOpen, userId]);

  /**
   * 外部リソース（ローカルストレージ、データベース）との同期
   * モーダルが開いた時、または日付・種目が変更された時にデータを読み込む
   */
  useEffect(() => {
    if (isOpen && exerciseId) {
      loadSets();
    } else if (!isOpen) {
      // モーダルが閉じられた時はリセット
      setSets([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, exerciseId, dateStr]);

  return {
    sets,
    setSets: updateSets, // updateSetsを返すことで、自動的にローカルストレージに保存される
    isLoading,
    saveSets,
    removeSets,
    loadSets,
  };
}
