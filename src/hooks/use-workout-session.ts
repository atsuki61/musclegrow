"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { SetRecord } from "@/types/workout";
// サーバー API: セッション取得・セット取得・セッション+セット一括保存
import {
  getWorkoutSession,
  getSets as getSetsFromAPI,
  saveSessionWithSets,
} from "@/lib/api";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useAuthSession } from "@/lib/auth-session-context";
// localStorage の安全な読み書き・削除（例外を握りつぶさないラッパー）
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/safe-local-storage";

/**
 * localStorage のキーを生成する
 * 形式: workout_{日付}_{種目ID}
 * 例: workout_2026-07-13_bench-press
 */
const getStorageKey = (date: Date, exerciseId: string): string => {
  const dateStr = formatDateToYYYYMMDD(date);
  return `workout_${dateStr}_${exerciseId}`;
};

/**
 * localStorage からセット一覧を読み込む
 * SSR 時は window が無いので null を返す
 */
const loadSetsFromStorage = (
  date: Date,
  exerciseId: string
): SetRecord[] | null => {
  // サーバー側レンダリングでは localStorage にアクセスできない
  if (typeof window === "undefined") return null;

  try {
    const key = getStorageKey(date, exerciseId);
    const stored = safeGetItem(key);
    // キーが存在しない場合
    if (!stored) return null;

    // JSON 文字列を SetRecord 配列にパース
    const parsed = JSON.parse(stored) as SetRecord[];
    return parsed;
  } catch (error) {
    // パース失敗やストレージ障害時は null（呼び出し側で初期セットにフォールバック）
    console.error("Failed to load sets from storage:", error);
    return null;
  }
};

/**
 * セット一覧を localStorage に保存する
 * 有効なデータ（重量・回数・時間のいずれかが正）がある場合のみ保存し、
 * 空相当のデータならキーを削除してゴミを残さない
 */
export const saveSetsToStorage = (
  date: Date,
  exerciseId: string,
  sets: SetRecord[] // １種目の全セット
): void => {
  // SSR ガード
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(date, exerciseId);
    // 重量・回数・時間のいずれかが入力されていれば「有効なデータ」とみなす
    const hasValidData = sets.some(
      (set) => (set.weight ?? 0) > 0 || set.reps > 0 || (set.duration ?? 0) > 0
    );
    if (hasValidData) {
      // 有効データあり → JSON 化して保存
      safeSetItem(key, JSON.stringify(sets));
    } else {
      // 空セットのみ → キーを削除（不要なストレージ汚染を防ぐ）
      safeRemoveItem(key);
    }
  } catch (error) {
    console.error("Failed to save sets to storage:", error);
  }
};

/**
 * 指定日付・種目のセットを localStorage から削除する
 */
const removeSetsFromStorage = (date: Date, exerciseId: string): void => {
  // SSR ガード
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(date, exerciseId);
    safeRemoveItem(key);
  } catch (error) {
    console.error("Failed to remove sets from storage:", error);
  }
};

/** フックのオプション（呼び出し側から渡す引数） */
interface UseWorkoutSessionOptions {
  /** 記録対象の日付 */
  date: Date;
  /** 種目 ID（モーダル未選択時は null） */
  exerciseId: string | null;
  /** 記録 UI（モーダル等）が開いているか */
  isOpen: boolean;
  /** ストレージにデータが無いときの初期セット生成関数（任意） */
  createInitialSet?: () => SetRecord;
}

/**
 * ワークアウトセッション（1日・1種目のセット一覧）を管理するカスタムフック
 *
 * データ戦略:
 * - 常に localStorage に保存（ゲスト / オフライン耐性）
 * - ログイン時は DB にも同期
 * - 読み込みは DB 優先 → 失敗時は localStorage → 無ければ初期セット
 */
export function useWorkoutSession({
  date,
  exerciseId,
  isOpen,
  createInitialSet,
}: UseWorkoutSessionOptions) {
  // ログイン中なら userId、ゲストなら null/undefined
  const { userId } = useAuthSession();

  // 画面上で編集中のセット一覧
  const [sets, setSets] = useState<SetRecord[]>([]);
  // 初回ロード中フラグ（UI のスケルトン等に利用）
  const [isLoading, setIsLoading] = useState(false);
  // 一度でもロード完了したか（空配列と「未ロード」を区別するため）
  const [isLoaded, setIsLoaded] = useState(false);

  // 前回の日付・種目を保持し、「切り替わった瞬間」に旧データを保存するため
  const previousDateRef = useRef<Date>(date);
  const previousExerciseIdRef = useRef<string | null>(exerciseId);

  // date オブジェクトの参照が変わっても同じ日なら同じ文字列になるように正規化
  // （useEffect の依存配列で安定したキーとして使う）
  const dateStr = useMemo(() => formatDateToYYYYMMDD(date), [date]);

  /**
   * セット一覧を更新しつつ、同時に localStorage へ書き込む
   * setState の updater 形式（関数）と直接配列の両方に対応
   */
  const updateSets = useCallback(
    (newSets: SetRecord[] | ((prev: SetRecord[]) => SetRecord[])) => {
      setSets((prevSets) => {
        // 関数なら前の値から計算、配列ならそのまま採用
        const updatedSets =
          typeof newSets === "function" ? newSets(prevSets) : newSets;

        // 種目が決まっているときだけストレージへ反映
        if (exerciseId) {
          saveSetsToStorage(date, exerciseId, updatedSets);
        }

        return updatedSets;
      });
    },
    [date, exerciseId]
  );

  /**
   * セット一覧を読み込む
   * 優先順位: DB（ログイン時）→ localStorage → createInitialSet / 空配列
   */
  const loadSets = useCallback(async () => {
    if (!exerciseId || !isOpen) {
      setSets([]);
      return;
    }

    setIsLoading(true);

    // ログインしている場合だけ、サーバーから取得を試みる
    if (userId) {
      try {
        const currentDateStr = formatDateToYYYYMMDD(date);
        // その日のワークアウトセッションを取得
        const sessionResult = await getWorkoutSession(currentDateStr);

        if (sessionResult.success && sessionResult.data) {
          // セッション内の当該種目のセットを取得
          const setsResult = await getSetsFromAPI(userId, {
            sessionId: sessionResult.data.id,
            exerciseId,
          });

          // DB にセットがあればそれを採用し、localStorage にもキャッシュ
          if (
            setsResult.success &&
            setsResult.data &&
            setsResult.data.length > 0
          ) {
            setSets(setsResult.data);
            saveSetsToStorage(date, exerciseId, setsResult.data);
            setIsLoading(false);
            setIsLoaded(true);
            return; // DB から取れたのでここで終了
          }
        }
      } catch (error) {
        // DB 失敗時は警告のみ出し、下の localStorage フォールバックへ進む
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "データベースからの取得に失敗、ローカルストレージから取得:",
            error
          );
        }
      }
    }

    // ローカルストレージから取得（ゲスト、または DB 取得失敗・空のとき）
    const loaded = loadSetsFromStorage(date, exerciseId);
    if (loaded && loaded.length > 0) {
      setSets(loaded);
    } else {
      // ストレージにも無い → 初期セットを1件作るか、空にする
      if (createInitialSet) {
        setSets([createInitialSet()]);
      } else {
        setSets([]);
      }
    }

    setIsLoading(false);
    setIsLoaded(true);
  }, [date, exerciseId, isOpen, userId, createInitialSet]);

  /**
   * セット一覧を明示的に保存する
   * 1. 常に localStorage
   * 2. ログイン時のみ DB（アトミックにセッション+セット）
   * 3. 他コンポーネント向けに CustomEvent を発火
   */
  const saveSets = useCallback(
    async (setsToSave: SetRecord[]) => {
      // 種目未選択なら何もしない
      if (!exerciseId) return;

      // 1. ローカルストレージに常に保存
      saveSetsToStorage(date, exerciseId, setsToSave);

      // 2. ログインしている場合にのみ、サーバーにも保存しにいく
      if (userId) {
        try {
          // セッションとセットをまとめて保存（途中失敗で不整合になりにくい）
          const currentDateStr = formatDateToYYYYMMDD(date);
          await saveSessionWithSets({
            date: currentDateStr,
            exerciseId,
            sets: setsToSave,
          });
        } catch (error) {
          // DB 失敗でも localStorage は済んでいるので、開発時のみ警告
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "データベースへの保存に失敗（ローカルストレージは保存済み）:",
              error
            );
          }
        }
      }

      // 履歴・ホームなど他画面に「記録が変わった」ことを通知
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

  /**
   * 現在の種目のセットをストレージから消し、画面上も空にする
   */
  const removeSets = useCallback(() => {
    if (!exerciseId) return;
    removeSetsFromStorage(date, exerciseId);
    setSets([]);
  }, [date, exerciseId]);

  // クロージャの古い sets を避けるため、最新の sets を ref に同期する
  // （日付/種目切り替え effect 内で「切り替わる前のセット」を保存するのに使う）
  const setsRef = useRef<SetRecord[]>(sets);

  // sets が変わるたびに ref を最新化する（外部システム＝ref との同期）
  useEffect(() => {
    setsRef.current = sets;
  }, [sets]);

  // 日付や種目が変わった際の自動保存
  // 「新しい日付/種目」に移る前に、直前の組み合わせのデータを書き出す
  useEffect(() => {
    const dateChanged = previousDateRef.current.getTime() !== date.getTime();
    const exerciseChanged = previousExerciseIdRef.current !== exerciseId;

    // 切り替えがあり、かつ UI が開いていて、前の種目とセットが存在するときだけ保存
    if (
      (dateChanged || exerciseChanged) &&
      isOpen &&
      previousExerciseIdRef.current &&
      setsRef.current.length > 0
    ) {
      // 直前の日付・種目キーで localStorage に保存
      saveSetsToStorage(
        previousDateRef.current,
        previousExerciseIdRef.current,
        setsRef.current
      );

      // userId がある場合（ログイン時）のみ DB へ保存
      if (userId) {
        // effect 内で await できないため即時実行の async IIFE を使う
        (async () => {
          try {
            const previousDateStr = formatDateToYYYYMMDD(
              previousDateRef.current
            );

            if (previousExerciseIdRef.current) {
              await saveSessionWithSets({
                date: previousDateStr,
                exerciseId: previousExerciseIdRef.current,
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
    }

    // 次回比較用に「現在」を前回として記録
    previousDateRef.current = date;
    previousExerciseIdRef.current = exerciseId;
  }, [date, exerciseId, isOpen, userId]);

  const sessionKey =
    isOpen && exerciseId ? `${dateStr}:${exerciseId}` : null;
  const [loadedSessionKey, setLoadedSessionKey] = useState<string | null>(null);

  if (sessionKey === null && loadedSessionKey !== null) {
    setLoadedSessionKey(null);
    setSets([]);
    setIsLoaded(false);
    setIsLoading(false);
  }

  // UI が開いているとき、種目や日付が変わったらセットを再読み込み
  // 閉じたときは状態をリセット（次回オープン時に古いデータが一瞬出ないように）
  useEffect(() => {
    if (isOpen && exerciseId) {
      loadSets();
    } else if (!isOpen) {
      setSets([]);
      setIsLoaded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, exerciseId, dateStr]);

  // 呼び出し側が使う公開 API
  return {
    sets, // 現在のセット一覧
    setSets: updateSets, // 更新（localStorage 連動）
    isLoading, // ロード中
    saveSets, // 明示保存（local + DB + イベント）
    removeSets, // 削除
    loadSets, // 手動再読み込み
    isLoaded, // ロード完了済みか
  };
}
