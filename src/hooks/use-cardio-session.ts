"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CardioRecord } from "@/types/workout";

/**
 * ローカルストレージのキーを生成（有酸素種目用）
 * 日付と種目IDを組み合わせて一意のキーを作成
 */
const getStorageKey = (date: Date, exerciseId: string): string => {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD形式
  return `cardio_${dateStr}_${exerciseId}`;
};

/**
 * ローカルストレージから有酸素種目の記録を取得
 */
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
    // 日付文字列をDateオブジェクトに変換
    return parsed.map((record) => ({
      ...record,
      date: new Date(record.date),
    }));
  } catch (error) {
    console.error("Failed to load cardio records from storage:", error);
    return null;
  }
};

/**
 * ローカルストレージに有酸素種目の記録を保存
 * 外部からも使用可能にするためエクスポート
 */
export const saveCardioRecordsToStorage = (
  date: Date,
  exerciseId: string,
  records: CardioRecord[]
): void => {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(date, exerciseId);
    // 空の記録（時間0、距離0のみ）は保存しない
    const hasValidData = records.some(
      (record) =>
        record.duration > 0 ||
        (record.distance ?? 0) > 0 ||
        (record.calories ?? 0) > 0 ||
        (record.heartRate ?? 0) > 0 ||
        (record.incline ?? 0) > 0
    );
    if (hasValidData) {
      localStorage.setItem(key, JSON.stringify(records));
    } else {
      // 無効なデータの場合は削除
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Failed to save cardio records to storage:", error);
  }
};

/**
 * ローカルストレージから有酸素種目の記録を削除
 */
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
  /** 日付 */
  date: Date;
  /** 種目ID */
  exerciseId: string | null;
  /** モーダルが開いているかどうか */
  isOpen: boolean;
  /** 初期記録を作成する関数（オプション） */
  createInitialRecord?: () => CardioRecord;
}

/**
 * 有酸素種目セッション管理フック
 * ローカルストレージを使用して有酸素種目の記録を保存・読み込み
 */
export function useCardioSession({
  date,
  exerciseId,
  isOpen,
  createInitialRecord,
}: UseCardioSessionOptions) {
  const [records, setRecords] = useState<CardioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 前回の日付と種目IDを追跡（日付変更時の自動保存用）
  const previousDateRef = useRef<Date>(date);
  const previousExerciseIdRef = useRef<string | null>(exerciseId);

  /**
   * 有酸素種目の記録を読み込む
   */
  const loadRecords = useCallback(() => {
    if (!exerciseId || !isOpen) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    const loaded = loadCardioRecordsFromStorage(date, exerciseId);
    if (loaded && loaded.length > 0) {
      setRecords(loaded);
    } else {
      // 保存済みデータがない場合、初期記録を作成（指定されている場合）
      if (createInitialRecord) {
        setRecords([createInitialRecord()]);
      } else {
        setRecords([]);
      }
    }
    setIsLoading(false);
  }, [date, exerciseId, isOpen, createInitialRecord]);

  /**
   * 有酸素種目の記録を保存する
   */
  const saveRecords = useCallback(
    (recordsToSave: CardioRecord[]) => {
      if (!exerciseId) return;

      saveCardioRecordsToStorage(date, exerciseId, recordsToSave);
    },
    [date, exerciseId]
  );

  /**
   * 有酸素種目の記録を削除する
   */
  const removeRecords = useCallback(() => {
    if (!exerciseId) return;

    removeCardioRecordsFromStorage(date, exerciseId);
    setRecords([]);
  }, [date, exerciseId]);

  // recordsの最新値を保持するref（日付変更時の保存用）
  const recordsRef = useRef<CardioRecord[]>(records);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

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
      recordsRef.current.length > 0
    ) {
      // 前回の日付と種目IDでデータを保存
      saveCardioRecordsToStorage(
        previousDateRef.current,
        previousExerciseIdRef.current,
        recordsRef.current
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
      loadRecords();
    } else if (!isOpen) {
      // モーダルが閉じられた時はリセット
      setRecords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, exerciseId, date.toISOString()]);

  return {
    records,
    setRecords,
    isLoading,
    saveRecords,
    removeRecords,
    loadRecords,
  };
}
