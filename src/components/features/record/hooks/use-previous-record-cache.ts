"use client";

/**
 * 前回記録の取得と画面内キャッシュ
 *
 * 入力: selectedDate, selectedExercise（モーダルで開いている種目）, userId
 * 出力:
 *   - previousRecord / isPreviousRecordLoading → ExerciseRecordModal に渡す
 *   - loadPreviousRecordForExercise            → 種目タップ時に呼ぶ
 *   - clear*                                   → モーダル開閉時に stuck 防止
 * 内部（触らなくてよい）: cache ref, 重複リクエスト防止用 ref
 */

import { useCallback, useRef, useState } from "react";
import {
  fetchPreviousRecord,
  type PreviousRecordData,
} from "@/hooks/use-previous-record";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import type { Exercise } from "@/types/workout";

interface PreviousRecordCacheEntry {
  record: PreviousRecordData;
  isLoading: boolean;
}

const getPreviousRecordCacheKey = (date: Date, exerciseId: string): string => {
  return `${formatDateToYYYYMMDD(date)}_${exerciseId}`;
};

interface UsePreviousRecordCacheParams {
  selectedDate: Date;
  selectedExercise: Exercise | null;
  userId: string | null | undefined;
}

export function usePreviousRecordCache({
  selectedDate,
  selectedExercise,
  userId,
}: UsePreviousRecordCacheParams) {
  // state は再レンダー用、ref は load コールバック内の最新キャッシュ参照用。
  const [previousRecordCache, setPreviousRecordCache] = useState<
    Record<string, PreviousRecordCacheEntry>
  >({});
  const previousRecordCacheRef = useRef<
    Record<string, PreviousRecordCacheEntry>
  >({});
  // 同一 cacheKey への fetch が走っている間は true（二重リクエスト防止）
  const previousRecordRequestKeysRef = useRef<Set<string>>(new Set());

  const updatePreviousRecordCache = useCallback(
    (
      updater: (
        prev: Record<string, PreviousRecordCacheEntry>
      ) => Record<string, PreviousRecordCacheEntry>
    ) => {
      const next = updater(previousRecordCacheRef.current);
      previousRecordCacheRef.current = next;
      setPreviousRecordCache(next);
    },
    []
  );

  const selectedPreviousRecordKey = selectedExercise
    ? getPreviousRecordCacheKey(selectedDate, selectedExercise.id)
    : null;
  const selectedPreviousRecordEntry = selectedPreviousRecordKey
    ? previousRecordCache[selectedPreviousRecordKey]
    : undefined;

  const loadPreviousRecordForExercise = useCallback(
    async (exercise: Exercise) => {
      const cacheKey = getPreviousRecordCacheKey(selectedDate, exercise.id);
      const cachedRecord = previousRecordCacheRef.current[cacheKey];
      const isRequesting = previousRecordRequestKeysRef.current.has(cacheKey);

      // 取得中(isLoading:true)はスキップしない。完了済み(!isLoading)だけ再取得を省略する。
      if (isRequesting || (cachedRecord && !cachedRecord.isLoading)) return;

      previousRecordRequestKeysRef.current.add(cacheKey);
      updatePreviousRecordCache((prev) => ({
        ...prev,
        [cacheKey]: { record: null, isLoading: true },
      }));

      try {
        const record = await fetchPreviousRecord(
          selectedDate,
          exercise,
          userId ?? null
        );
        updatePreviousRecordCache((prev) => ({
          ...prev,
          [cacheKey]: { record, isLoading: false },
        }));
      } catch (error) {
        console.error("前回記録取得エラー", error);
        updatePreviousRecordCache((prev) => ({
          ...prev,
          [cacheKey]: { record: null, isLoading: false },
        }));
      } finally {
        previousRecordRequestKeysRef.current.delete(cacheKey);
      }
    },
    [selectedDate, updatePreviousRecordCache, userId]
  );

  // モーダルを閉じたとき: 進行中の loading エントリを消して次回再取得できるようにする
  const clearSelectedPreviousRecordLoading = useCallback(() => {
    if (!selectedPreviousRecordKey) return;

    previousRecordRequestKeysRef.current.delete(selectedPreviousRecordKey);
    const selectedEntry =
      previousRecordCacheRef.current[selectedPreviousRecordKey];

    if (!selectedEntry?.isLoading) return;

    updatePreviousRecordCache((prev) => {
      const next = { ...prev };
      delete next[selectedPreviousRecordKey];
      return next;
    });
  }, [selectedPreviousRecordKey, updatePreviousRecordCache]);

  // 同じ種目を開き直すとき: 前回 stuck した loading があれば消してから fetch する
  const clearPreviousRecordLoadingForExercise = useCallback(
    (exercise: Exercise) => {
      const cacheKey = getPreviousRecordCacheKey(selectedDate, exercise.id);
      previousRecordRequestKeysRef.current.delete(cacheKey);
      const selectedEntry = previousRecordCacheRef.current[cacheKey];

      if (!selectedEntry?.isLoading) return;

      updatePreviousRecordCache((prev) => {
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
    },
    [selectedDate, updatePreviousRecordCache]
  );

  return {
    clearPreviousRecordLoadingForExercise,
    clearSelectedPreviousRecordLoading,
    isPreviousRecordLoading: selectedPreviousRecordEntry?.isLoading ?? false,
    loadPreviousRecordForExercise,
    previousRecord: selectedPreviousRecordEntry?.record ?? null,
  };
}
