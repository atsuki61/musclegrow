"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface HorizontalNavProps<T extends string> {
  items: Array<{ value: T; label: string; className?: string }>;
  value: T;
  onChange: (value: T) => void;
}

/**
 * 横スクロール可能なナビゲーションコンポーネント
 * 記録画面・履歴画面のナビゲーションとデザインを統一
 */
export function HorizontalNav<T extends string>({
  items,
  value,
  onChange,
}: HorizontalNavProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 選択されたタブが画面外にある場合、自動スクロール
  useEffect(() => {
    if (scrollContainerRef.current) {
      // data-state="active" の要素を探す
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
  }, [value]);

  return (
    // 枠線を削除し、シンプルな横スクロールエリアに
    <div
      ref={scrollContainerRef}
      className="w-full overflow-x-auto no-scrollbar py-2"
    >
      <div className="flex gap-2 px-1 min-w-max">
        {items.map((item) => {
          const isSelected = value === item.value;

          return (
            <button
              key={item.value}
              onClick={() => onChange(item.value)}
              data-state={isSelected ? "active" : "inactive"}
              className={cn(
                // 記録画面(body-part-navigation)と同じスタイル定義
                "px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-300 active:scale-95",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
                item.className
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
