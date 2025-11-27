"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BODY_PART_LABELS } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";

const BODY_PARTS: Exclude<BodyPart, "all">[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "other",
];

interface BodyPartNavigationProps {
  selectedPart?: Exclude<BodyPart, "all">;
  onPartChange?: (part: Exclude<BodyPart, "all">) => void;
}

export function BodyPartNavigation({
  selectedPart = "chest",
  onPartChange,
}: BodyPartNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 選択されたタブが画面外にある場合、自動スクロール
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
        {BODY_PARTS.map((part) => {
          const isSelected = selectedPart === part;
          return (
            <button
              key={part}
              onClick={() => onPartChange?.(part)}
              data-state={isSelected ? "active" : "inactive"}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-300 active:scale-95",
                // 修正: bg-primary でテーマカラーを適用
                // text-primary-foreground で文字色を自動調整（白など）
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {BODY_PART_LABELS[part]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
