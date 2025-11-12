"use client";

import { useState, useEffect, useCallback } from "react";
import { calculateMaxWeights } from "@/lib/max-weight";

/**
 * 最大重量を管理するカスタムフック
 * ローカルストレージから各種目の最大重量を取得し、更新時に再計算する
 */
export function useMaxWeights() {
  const [maxWeights, setMaxWeights] = useState<Record<string, number>>({});

  // 最大重量を再計算する関数
  const recalculateMaxWeights = useCallback(() => {
    const weights = calculateMaxWeights();
    setMaxWeights(weights);
  }, []);

  // 初回マウント時に最大重量を取得
  useEffect(() => {
    recalculateMaxWeights();
  }, [recalculateMaxWeights]);

  return {
    maxWeights,
    recalculateMaxWeights,
  };
}

