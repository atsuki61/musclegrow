"use client";

import { useState, useEffect, useCallback } from "react";
import { getLastTrainedDates as getLocalLastTrainedDates } from "@/lib/last-trained";
import { getLastTrainedDatesFromDB } from "@/lib/actions/workout-sessions";
import { useAuthSession } from "@/lib/auth-session-context";

export function useLastTrainedDates() {
  const { userId } = useAuthSession();
  const [lastTrainedDates, setLastTrainedDates] = useState<
    Record<string, Date>
  >({});

  const refresh = useCallback(async () => {
    // 1. ローカルストレージから取得
    const localDates = getLocalLastTrainedDates();

    const mergedDates = { ...localDates };

    // 2. サーバーから取得してマージ
    if (userId) {
      try {
        const result = await getLastTrainedDatesFromDB(userId);
        if (result.success && result.data) {
          Object.entries(result.data).forEach(([exerciseId, dateStr]) => {
            const dbDate = new Date(dateStr);
            const localDate = mergedDates[exerciseId];

            if (!localDate || dbDate > localDate) {
              mergedDates[exerciseId] = dbDate;
            }
          });
        }
      } catch (e) {
        console.error("最終トレーニング日取得エラー(DB)", e);
      }
    }

    setLastTrainedDates(mergedDates);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { lastTrainedDates, refresh };
}
