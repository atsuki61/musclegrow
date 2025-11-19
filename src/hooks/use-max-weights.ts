// src/hooks/use-max-weights.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type MaxWeightsMap,
  loadMaxWeightsCache,
  saveMaxWeightsCache,
  calculateMaxWeightsFromStorage,
} from "@/lib/max-weight";

/** requestIdleCallback の型定義 */
type IdleCallbackHandle = number;

/**
 * requestIdleCallback を使って重い処理をアイドル時に実行
 */
function runOnIdle(cb: () => void, timeout = 2000): IdleCallbackHandle | null {
  if (typeof window === "undefined") return null;

  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(() => cb(), { timeout });
  }

  // fallback
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

/**
 * 最大重量の管理フック
 */
export function useMaxWeights(): {
  maxWeights: MaxWeightsMap;
  recalculateMaxWeights: () => void;
} {
  // 1) 初期値は軽いキャッシュ
  const [maxWeights, setMaxWeights] = useState<MaxWeightsMap>(() => {
    return loadMaxWeightsCache();
  });

  // 2) 重い再計算
  const runHeavyRecalc = useCallback(() => {
    const fresh = calculateMaxWeightsFromStorage();
    setMaxWeights(fresh);
    saveMaxWeightsCache(fresh);
  }, []);

  // 3) 外部から呼べる再計算
  const recalculateMaxWeights = useCallback(() => {
    runOnIdle(runHeavyRecalc);
  }, [runHeavyRecalc]);

  // 4) 初回 hydration 後に idle で更新する
  useEffect(() => {
    const handle = runOnIdle(runHeavyRecalc);

    return () => cancelIdle(handle);
  }, [runHeavyRecalc]);

  return { maxWeights, recalculateMaxWeights };
}
