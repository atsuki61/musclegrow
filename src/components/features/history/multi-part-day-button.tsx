"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";
// useColorThemeは不要になったので削除してOKですが、残っていても問題ありません

interface MultiPartDayButtonProps {
  date: Date;
  bodyParts: BodyPart[];
  isSelected?: boolean;
  onClick?: (() => void) | React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  [key: string]: unknown;
}

/**
 * 複数部位の日付セルボタンコンポーネント
 */
function MultiPartDayButton({
  date,
  bodyParts,
  isSelected = false,
  onClick,
  className,
  ...props
}: MultiPartDayButtonProps) {
  const dayNumber = date.getDate();
  const numParts = bodyParts.length;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /** 部位数に応じてグリッドの行数・列数を決定 */
  const getGridConfig = (count: number) => {
    if (count === 1) return { rows: 1, cols: 1 };
    if (count === 2) return { rows: 1, cols: 2 };
    if (count === 3) return { rows: 2, cols: 2 };
    if (count === 4) return { rows: 2, cols: 2 };
    if (count <= 6) return { rows: 2, cols: 3 };
    return { rows: 3, cols: 3 };
  };

  const gridConfig = getGridConfig(numParts);

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

  /** onClick 統合処理 */
  const { onClick: propsOnClick, ...restProps } = props;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      if (onClick.length === 0) {
        (onClick as () => void)();
      } else {
        (onClick as React.MouseEventHandler<HTMLButtonElement>)(e);
      }
    } else if (propsOnClick && typeof propsOnClick === "function") {
      propsOnClick(e);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "relative h-full w-full min-w-0 p-0 overflow-hidden rounded-md",
        // 選択時のリング色はテーマカラー(primary)
        isSelected && "ring-2 ring-primary ring-offset-0 z-10",
        className
      )}
      {...restProps}
    >
      {/* 背景: 部位ごとの色をグリッドで分割表示 */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
          gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
        }}
      >
        {bodyParts
          .slice(0, gridConfig.rows * gridConfig.cols)
          .map((part, index) => {
            // シンプルテーマでも部位の色分けは維持する（強制グレー化ロジックを削除）
            const colorVar =
              partColorVar[part as string] || "var(--color-other)";

            return (
              <div
                key={`${part}-${index}`}
                // 修正: dark:opacity-80 に上げて、ダークモード時の発色を強くする
                className="w-full h-full transition-colors duration-300 opacity-60 dark:opacity-90"
                style={{
                  backgroundColor: colorVar,
                }}
              />
            );
          })}
      </div>

      {/* 日付番号（前面） */}
      <span className="relative z-10 text-sm font-medium text-foreground drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {dayNumber}
      </span>
    </Button>
  );
}

export default React.memo(MultiPartDayButton);
