"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SetRecord } from "@/types/workout";

/**
 * ローカルストレージのキーを生成
 * 日付と種目IDを組み合わせて一意のキーを作成
 */
const getStorageKey = (date: Date, exerciseId: string): string => {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD形式
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
    // 空のセット（重量0、回数0のみ）は保存しない
    const hasValidData = sets.some((set) => set.weight > 0 || set.reps > 0);
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
  const [sets, setSets] = useState<SetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 前回の日付と種目IDを追跡（日付変更時の自動保存用）
  const previousDateRef = useRef<Date>(date);
  const previousExerciseIdRef = useRef<string | null>(exerciseId);

  /**
   * セット記録を読み込む
   */
  const loadSets = useCallback(() => {
    if (!exerciseId || !isOpen) {
      setSets([]);
      return;
    }

    setIsLoading(true);
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
  }, [date, exerciseId, isOpen, createInitialSet]);

  /**
   * セット記録を保存する
   */
  const saveSets = useCallback(
    (setsToSave: SetRecord[]) => {
      if (!exerciseId) return;

      saveSetsToStorage(date, exerciseId, setsToSave);
    },
    [date, exerciseId]
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
  useEffect(() => {
    setsRef.current = sets;
  }, [sets]);

  /**
   * 日付または種目が変更された時に、前回のデータを保存
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
      // 前回の日付と種目IDでデータを保存
      saveSetsToStorage(
        previousDateRef.current,
        previousExerciseIdRef.current,
        setsRef.current
      );
    }

    // 参照を更新
    previousDateRef.current = date;
    previousExerciseIdRef.current = exerciseId;
  }, [date, exerciseId, isOpen]);

  /**
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
  }, [isOpen, exerciseId, date.toISOString()]);

  return {
    sets,
    setSets,
    isLoading,
    saveSets,
    removeSets,
    loadSets,
  };
}
