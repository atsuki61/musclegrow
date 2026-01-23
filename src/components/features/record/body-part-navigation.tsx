"use client";

import { useRef, useEffect } from "react";
// framer-motion: アニメーションライブラリ
// - motion: アニメーション付きのHTML要素を作成
// - layoutId でアニメーションの自動補間を実現
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BODY_PART_LABELS } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";

// 定数定義
const BODY_PARTS_WITHOUT_ALL: Exclude<BodyPart, "all">[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "other",
];

// 部位ごとのCSS変数マッピング（背景色）
const PART_COLOR_VARS: Record<string, string> = {
  all: "var(--primary)",
  chest: "var(--color-chest)",
  back: "var(--color-back)",
  legs: "var(--color-legs)",
  shoulders: "var(--color-shoulders)",
  arms: "var(--color-arms)",
  core: "var(--color-core)",
  other: "var(--color-other)",
};

// ▼ 追加: 部位ごとの文字色マッピング（選択時用）
const PART_TEXT_VARS: Record<string, string> = {
  all: "var(--primary-foreground)", // テーマに合わせて自動調整（黄色の時は黒字など）
  chest: "#ffffff",
  back: "#ffffff",
  legs: "#ffffff",
  shoulders: "#ffffff",
  arms: "#ffffff",
  core: "#ffffff",
  other: "var(--color-other-foreground)", // ライト/ダークで白黒反転
};

interface BodyPartNavigationProps {
  selectedPart?: BodyPart;
  onPartChange?: (part: BodyPart) => void;
  showAll?: boolean;
}

export function BodyPartNavigation({
  selectedPart = "chest",
  onPartChange,
  showAll = false,
}: BodyPartNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const partsToRender: BodyPart[] = showAll
    ? ["all", ...BODY_PARTS_WITHOUT_ALL]
    : BODY_PARTS_WITHOUT_ALL;

  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedTab = scrollContainerRef.current.querySelector(
        `[data-state="active"]`
      ) as HTMLElement;

      if (selectedTab) {
        const container = scrollContainerRef.current;
        const scrollLeft =
          selectedTab.offsetLeft -
          container.offsetWidth / 2 +
          selectedTab.offsetWidth / 2;

        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [selectedPart]);

  return (
    <div
      ref={scrollContainerRef}
      className="w-full overflow-x-auto no-scrollbar py-2"
    >
      <div className="flex gap-2 px-1 min-w-max">
        {partsToRender.map((part) => {
          const isSelected = selectedPart === part;
          const colorVar = PART_COLOR_VARS[part];
          // ▼ 追加: 選択時の文字色を取得
          const textVar = PART_TEXT_VARS[part];

          return (
            // ① motion.button: タップ時とホバー時のアニメーションを追加
            <motion.button
              key={part}
              onClick={() => onPartChange?.(part)}
              data-state={isSelected ? "active" : "inactive"}
              // タップ時に軽く縮小、ホバー時に軽く拡大
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              // 選択時の「成功感」アニメーション
              // key が変わると再マウントされ、アニメーションが発動
              animate={isSelected ? {
                // 選択時: 軽く拡大→縮小のパルスアニメーション
                scale: [1, 1.05, 1],
              } : {
                scale: 1,
              }}
              transition={{
                // キーフレームアニメーションを使用（spring は2キーフレームまで）
                // tween を使用することで3つ以上のキーフレームが可能
                type: "tween",
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "relative px-5 py-1.5 rounded-full text-sm font-bold border",
                "border-transparent"
              )}
              style={{
                backgroundColor: isSelected
                  ? colorVar
                  : `color-mix(in srgb, ${colorVar} 15%, transparent)`,
                // 選択時は専用の文字色変数を使う
                color: isSelected ? textVar : colorVar,
                borderColor: isSelected
                  ? "transparent"
                  : `color-mix(in srgb, ${colorVar} 30%, transparent)`,
                boxShadow: isSelected
                  ? `0 4px 12px -2px color-mix(in srgb, ${colorVar} 50%, transparent)`
                  : "none",
              }}
            >
              {BODY_PART_LABELS[part]}

              {/*
                ① 選択中のボタンに下線アニメーションを追加
                layoutId を使用すると、同じ layoutId を持つ要素間で
                位置やサイズが自動的にアニメーションされる
              */}
              {isSelected && (
                <motion.span
                  layoutId="underline"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                  style={{ backgroundColor: textVar }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
