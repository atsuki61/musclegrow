"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { BODY_PART_COLOR_HEX, getLightBackgroundColor, cn } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";

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

  /** 部位数に応じてグリッドの行数・列数を決定 */
  const getGridConfig = (count: number) => {
    // ▼ 修正: 1つの場合は 1x1 (全画面塗りつぶし)
    if (count === 1) return { rows: 1, cols: 1 };
    if (count === 2) return { rows: 1, cols: 2 };
    if (count === 3) return { rows: 2, cols: 2 };
    if (count === 4) return { rows: 2, cols: 2 };
    if (count <= 6) return { rows: 2, cols: 3 };
    return { rows: 3, cols: 3 };
  };

  const gridConfig = getGridConfig(numParts);

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
        // ▼ 修正: 固定サイズを削除し、親要素いっぱい(h-full w-full)に広げる
        "relative h-full w-full min-w-0 p-0 overflow-hidden rounded-md",
        isSelected && "ring-2 ring-primary ring-offset-0 z-10", // 選択時のリング
        className
      )}
      {...restProps}
    >
      {/* 背景: 部位ごとの色をグリッドで分割表示 */}
      <div
        className="absolute inset-0 grid" // m-px削除
        style={{
          gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
          gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
        }}
      >
        {bodyParts
          .slice(0, gridConfig.rows * gridConfig.cols)
          .map((part, index) => {
            const colorHex =
              BODY_PART_COLOR_HEX[part as Exclude<BodyPart, "all">];
            const lightColor = getLightBackgroundColor(colorHex, 0.4);

            return (
              <div
                key={`${part}-${index}`}
                style={{ backgroundColor: lightColor }}
                className="w-full h-full"
              />
            );
          })}
      </div>

      {/* 日付番号（前面） */}
      <span className="relative z-10 text-sm font-medium text-foreground drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
        {dayNumber}
      </span>
    </Button>
  );
}

export default React.memo(MultiPartDayButton);
