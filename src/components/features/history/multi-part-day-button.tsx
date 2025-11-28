"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";

interface MultiPartDayButtonProps {
  date: Date;
  bodyParts: BodyPart[];
  isSelected?: boolean;
  onClick?: (() => void) | React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  [key: string]: unknown;
}

function MultiPartDayButton({
  date,
  bodyParts,
  isSelected = false,
  onClick,
  className,
  ...props
}: MultiPartDayButtonProps) {
  const dayNumber = date.getDate();

  // 部位とCSS変数のマッピング
  const partColorVar: Record<string, string> = {
    chest: "var(--color-chest)",
    back: "var(--color-back)",
    legs: "var(--color-legs)",
    shoulders: "var(--color-shoulders)",
    arms: "var(--color-arms)",
    core: "var(--color-core)",
    other: "var(--color-other)",
  };

  /**
   * 円グラフ（ルーレット）用のスタイルを生成
   */
  const getBackgroundStyle = () => {
    if (bodyParts.length === 0) return {};

    // 1色だけの場合
    if (bodyParts.length === 1) {
      const part = bodyParts[0] as string;
      const colorVar = partColorVar[part] || "var(--color-other)";

      return { backgroundColor: colorVar };
    }

    // 複数色の場合: conic-gradientを生成
    const segmentSize = 100 / bodyParts.length;
    const gradients = bodyParts.map((part, index) => {
      const colorVar = partColorVar[part as string] || "var(--color-other)";

      const start = index * segmentSize;
      const end = (index + 1) * segmentSize;
      return `${colorVar} ${start}% ${end}%`;
    });

    return {
      background: `conic-gradient(${gradients.join(", ")})`,
    };
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      if (onClick.length === 0) (onClick as () => void)();
      else (onClick as React.MouseEventHandler<HTMLButtonElement>)(e);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-[2px]">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn(
          "relative w-full h-full aspect-square p-0 overflow-hidden rounded-full shadow-sm transition-all duration-300",
          "hover:scale-105 active:scale-95",
          // 選択時のリング色はテーマカラー(primary)のまま
          isSelected &&
            "ring-2 ring-primary ring-offset-2 ring-offset-background z-10",
          className
        )}
        {...props}
      >
        {/* 背景レイヤー */}
        <div
          className="absolute inset-0 transition-opacity duration-300 opacity-60 dark:opacity-80"
          style={getBackgroundStyle()}
        />

        {/* テキストオーバーレイ */}
        {bodyParts.length > 0 && (
          <div className="absolute inset-0 bg-background/10 backdrop-blur-[0.5px]" />
        )}

        {/* 日付番号 */}
        <span
          className={cn(
            "relative z-10 text-sm font-medium",
            bodyParts.length > 0
              ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
              : "text-foreground"
          )}
        >
          {dayNumber}
        </span>
      </Button>
    </div>
  );
}

export default React.memo(MultiPartDayButton);
