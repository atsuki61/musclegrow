// src/hooks/use-max-weights.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type MaxWeightsMap,
  loadMaxWeightsCache,
  saveMaxWeightsCache,
  calculateMaxWeightsFromStorage,
} from "@/lib/max-weight";
import { getUserMaxWeights } from "@/lib/actions/sets";
import { useAuthSession } from "@/lib/auth-session-context";

type IdleCallbackHandle = number;

function runOnIdle(cb: () => void, timeout = 2000): IdleCallbackHandle | null {
  if (typeof window === "undefined") return null;

  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(() => cb(), { timeout });
  }
  return window.setTimeout(cb, 0);
}

function cancelIdle(handle: IdleCallbackHandle | null): void {
  if (handle === null || typeof window === "undefined") return;

  if (typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(handle);
  } else {
    window.clearTimeout(handle);
  }
}

export function useMaxWeights(): {
  maxWeights: MaxWeightsMap;
  recalculateMaxWeights: () => void;
} {
  const { userId } = useAuthSession();

  // 1) 初期値は軽いキャッシュ
  const [maxWeights, setMaxWeights] = useState<MaxWeightsMap>(() => {
    return loadMaxWeightsCache();
  });

  // 2) ローカルとDBをマージして再計算
  const runHeavyRecalc = useCallback(async () => {
    // ローカルストレージからの計算（同期処理）
    const localMax = calculateMaxWeightsFromStorage();

    const mergedMax: MaxWeightsMap = { ...localMax };

    // DBからの取得（非同期処理）- ログイン時のみ
    if (userId) {
      try {
        const dbResult = await getUserMaxWeights(userId);
        if (dbResult.success && dbResult.data) {
          // ローカルとDBの値を比較し、大きい方を採用
          const dbData = dbResult.data;
          Object.keys(dbData).forEach((exerciseId) => {
            const dbWeight = dbData[exerciseId];
            const localWeight = mergedMax[exerciseId] ?? 0;

            if (typeof dbWeight === "number" && dbWeight > localWeight) {
              mergedMax[exerciseId] = dbWeight;
            }
          });
        }
      } catch (e) {
        console.error("DBからのMAX重量取得に失敗", e);
      }
    }

    // ステート更新とキャッシュ保存
    setMaxWeights(mergedMax);
    saveMaxWeightsCache(mergedMax);
  }, [userId]);

  // 3) 外部から呼べる再計算（非同期関数をラップ）
  const recalculateMaxWeights = useCallback(() => {
    runOnIdle(() => {
      runHeavyRecalc().catch((e) => console.error("MAX重量再計算エラー", e));
    });
  }, [runHeavyRecalc]);

  // 4) 初回 hydration 後または userId 変更時に更新
  useEffect(() => {
    const handle = runOnIdle(() => {
      runHeavyRecalc().catch((e) => console.error("MAX重量初期計算エラー", e));
    });

    return () => cancelIdle(handle);
  }, [runHeavyRecalc]);

  return { maxWeights, recalculateMaxWeights };
}
