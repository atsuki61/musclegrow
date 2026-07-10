"use client";

/**
 * 部位タブの左右スワイプ制御
 *
 * 入力: selectedPart, onPartChange（部位変更時に record-page が検索・編集をリセット）
 * 出力: swipeDirection / handleDragEnd / showSwipeHint / resetSwipeDirection
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { PanInfo } from "framer-motion";
import type { BodyPart } from "@/types/workout";

const BODY_PARTS_ORDER: Exclude<BodyPart, "all">[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "other",
];

// 誤操作を避けるため、短い横移動は部位切り替えとして扱わない。
const SWIPE_THRESHOLD = 50;
const SWIPE_HINT_SHOWN_KEY = "record_swipe_hint_shown";

const swipeHintListeners = new Set<() => void>();

function subscribeSwipeHint(onStoreChange: () => void) {
  swipeHintListeners.add(onStoreChange);
  return () => {
    swipeHintListeners.delete(onStoreChange);
  };
}

function notifySwipeHintChange() {
  swipeHintListeners.forEach((listener) => listener());
}

function readHasSeenSwipeHint(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SWIPE_HINT_SHOWN_KEY) === "true";
}

interface UseBodyPartSwipeParams {
  selectedPart: Exclude<BodyPart, "all">;
  onPartChange: (part: Exclude<BodyPart, "all">) => void;
}

export function useBodyPartSwipe({
  selectedPart,
  onPartChange,
}: UseBodyPartSwipeParams) {
  // swipeDirection: 1=左スワイプ(次の部位), -1=右スワイプ(前の部位), 0=タブ操作
  const [swipeDirection, setSwipeDirection] = useState(0);
  const [hintDismissedByTimer, setHintDismissedByTimer] = useState(false);

  const hasSeenSwipeHint = useSyncExternalStore(
    subscribeSwipeHint,
    readHasSeenSwipeHint,
    () => true,
  );

  const showSwipeHint = !hasSeenSwipeHint && !hintDismissedByTimer;

  // 外部タイマー: 初回ヒントを 3 秒後に非表示にして localStorage へ記録
  useEffect(() => {
    if (!showSwipeHint) return;
    const timer = setTimeout(() => {
      localStorage.setItem(SWIPE_HINT_SHOWN_KEY, "true");
      notifySwipeHintChange();
      setHintDismissedByTimer(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showSwipeHint]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const currentIndex = BODY_PARTS_ORDER.indexOf(selectedPart);
      const offsetX = info.offset.x;

      // 左スワイプは次の部位、右スワイプは前の部位へ移動する。
      if (offsetX < -SWIPE_THRESHOLD) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < BODY_PARTS_ORDER.length) {
          setSwipeDirection(1);
          onPartChange(BODY_PARTS_ORDER[nextIndex]);
        }
        return;
      }

      if (offsetX > SWIPE_THRESHOLD) {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          setSwipeDirection(-1);
          onPartChange(BODY_PARTS_ORDER[prevIndex]);
        }
      }
    },
    [onPartChange, selectedPart],
  );

  const resetSwipeDirection = useCallback(() => {
    setSwipeDirection(0);
  }, []);

  return {
    handleDragEnd,
    resetSwipeDirection,
    showSwipeHint,
    swipeDirection,
  };
}
