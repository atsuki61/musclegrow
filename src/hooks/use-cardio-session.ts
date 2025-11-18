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

/**
 * ローカルストレージのキーを生成（有酸素種目用）
 * 日付と種目IDを組み合わせて一意のキーを作成
 * ローカルタイムゾーン（日本時間）で日付を取得
 */
const getStorageKey = (date: Date, exerciseId: string): string => {
  const dateStr = formatDateToYYYYMMDD(date); // YYYY-MM-DD形式（ローカルタイムゾーン）
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
  const { userId } = useAuthSession();
  const [records, setRecords] = useState<CardioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 前回の日付と種目IDを追跡（日付変更時の自動保存用）
  const previousDateRef = useRef<Date>(date);
  const previousExerciseIdRef = useRef<string | null>(exerciseId);

  // 日付文字列をメモ化（useEffectの依存配列で使用）
  const dateStr = useMemo(() => formatDateToYYYYMMDD(date), [date]);

  /**
   * 記録を更新し、ローカルストレージにも即座に保存する
   * この関数を使うことで、削除時にも確実にローカルストレージが更新される
   */
  const updateRecords = useCallback(
    (
      newRecords:
        | CardioRecord[]
        | ((prev: CardioRecord[]) => CardioRecord[])
    ) => {
      setRecords((prevRecords) => {
        const updatedRecords =
          typeof newRecords === "function"
            ? newRecords(prevRecords)
            : newRecords;

        // ローカルストレージに即座に保存
        if (exerciseId) {
          saveCardioRecordsToStorage(date, exerciseId, updatedRecords);
        }

        return updatedRecords;
      });
    },
    [date, exerciseId]
  );

  /**
   * 有酸素種目の記録を読み込む
   * データベースから取得を試み、失敗した場合はローカルストレージから取得
   */
  const loadRecords = useCallback(async () => {
    if (!exerciseId || !isOpen) {
      setRecords([]);
      return;
    }

    setIsLoading(true);

    // まずデータベースから取得を試みる
    try {
      const dateStr = formatDateToYYYYMMDD(date); // YYYY-MM-DD形式（ローカルタイムゾーン）
      const sessionResult = await getWorkoutSession(userId, dateStr);

      if (sessionResult.success && sessionResult.data) {
        // セッションが存在する場合、有酸素記録を取得
        const recordsResult = await getCardioRecordsFromAPI(userId, {
          sessionId: sessionResult.data.id,
          exerciseId,
        });

        if (
          recordsResult.success &&
          recordsResult.data &&
          recordsResult.data.length > 0
        ) {
          // データベースから取得できた場合
          // セッションの日付を各記録に設定
          const recordsWithDate = recordsResult.data.map((record) => ({
            ...record,
            date: new Date(sessionResult.data!.date),
          }));
          setRecords(recordsWithDate);
          // ローカルストレージにも同期（オフライン対応）
          saveCardioRecordsToStorage(date, exerciseId, recordsWithDate);
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
  }, [date, exerciseId, isOpen, createInitialRecord, userId]);

  /**
   * 有酸素種目の記録を保存する
   * ローカルストレージに即座に保存し、認証済みの場合はデータベースにも保存
   */
  const saveRecords = useCallback(
    async (recordsToSave: CardioRecord[]) => {
      if (!exerciseId) return;

      // 1. ローカルストレージに即座に保存（既存の動作を維持）
      saveCardioRecordsToStorage(date, exerciseId, recordsToSave);

      // 2. データベースにも保存を試みる（非同期、エラー時はログのみ）
      try {
        const dateStr = formatDateToYYYYMMDD(date); // YYYY-MM-DD形式（ローカルタイムゾーン）

        // セッションを保存または取得
        const sessionResult = await saveWorkoutSession(userId, {
          date: dateStr,
        });

        if (sessionResult.success && sessionResult.data) {
          // 有酸素記録を保存
          await saveCardioRecordsToAPI(userId, {
            sessionId: sessionResult.data.id,
            exerciseId,
            records: recordsToSave,
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
   * 有酸素種目の記録を削除する
   */
  const removeRecords = useCallback(() => {
    if (!exerciseId) return;

    removeCardioRecordsFromStorage(date, exerciseId);
    setRecords([]);
  }, [date, exerciseId]);

  // recordsの最新値を保持するref（日付変更時の保存用）
  const recordsRef = useRef<CardioRecord[]>(records);
  
  /**
   * 外部リソース（メモリ内のref）との同期
   * recordsの最新値をrefに保持し、日付変更時の保存で使用
   */
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

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
      recordsRef.current.length > 0
    ) {
      // 前回の日付と種目IDでデータを保存（ローカルストレージ）
      saveCardioRecordsToStorage(
        previousDateRef.current,
        previousExerciseIdRef.current,
        recordsRef.current
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
            await saveCardioRecordsToAPI(userId, {
              sessionId: sessionResult.data.id,
              exerciseId: previousExerciseIdRef.current!,
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
      loadRecords();
    } else if (!isOpen) {
      // モーダルが閉じられた時はリセット
      setRecords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, exerciseId, dateStr]);

  return {
    records,
    setRecords: updateRecords, // updateRecordsを返すことで、自動的にローカルストレージに保存される
    isLoading,
    saveRecords,
    removeRecords,
    loadRecords,
  };
}
