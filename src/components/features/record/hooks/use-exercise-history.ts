"use client";

import { useState, useEffect } from "react";
import { useAuthSession } from "@/lib/auth-session-context";
import { getExerciseHistory } from "@/lib/actions/history";
import { getExerciseHistoryFromStorage } from "@/lib/local-storage-history";

// 履歴データの型定義
export type HistoryRecord = {
  date: Date;
  sets: Array<{
    weight: number | null;
    reps: number;
    duration: number | null;
    setOrder: number;
  }>;
};

export function useExerciseHistory(exerciseId: string) {
  const { userId } = useAuthSession();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        if (userId) {
          // ログインユーザー: サーバーから取得
          const result = await getExerciseHistory(userId, exerciseId);
          if (result.success && result.data) {
            setHistory(result.data);
          }
        } else {
          // ゲストユーザー: ローカルストレージから取得
          const localData = getExerciseHistoryFromStorage(exerciseId);
          setHistory(localData);
        }
      } catch (error) {
        console.error("履歴の取得に失敗しました", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (exerciseId) {
      fetchHistory();
    }
  }, [userId, exerciseId]);

  return { history, isLoading };
}
