"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { BODY_PART_COLOR_HEX, getLightBackgroundColor, cn } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";

interface MultiPartDayButtonProps {
  /** 日付 */
  date: Date;
  /** その日の部位配列 */
  bodyParts: BodyPart[];
  /** 選択されているか */
  isSelected?: boolean;
  /** クリック時のコールバック */
  onClick?: (() => void) | React.MouseEventHandler<HTMLButtonElement>;
  /** その他のprops */
  className?: string;
  /** react-day-pickerのDayButtonから渡されるprops */
  [key: string]: unknown;
}

/**
 * 複数部位の日付セルボタンコンポーネント
 * セルを部位数に応じて分割表示
 */
export function MultiPartDayButton({
  date,
  bodyParts,
  isSelected = false,
  onClick,
  className,
  ...props
}: MultiPartDayButtonProps) {
  const dayNumber = date.getDate();
  const numParts = bodyParts.length;

  // グリッドレイアウトの計算
  // 2部位: 1行2列
  // 3部位: 2行2列（上2つ、下1つ）
  // 4部位: 2行2列
  // 5部位以上: 3行2列など
  const getGridConfig = (count: number) => {
    if (count === 2) return { rows: 1, cols: 2 };
    if (count === 3) return { rows: 2, cols: 2 };
    if (count === 4) return { rows: 2, cols: 2 };
    if (count <= 6) return { rows: 2, cols: 3 };
    return { rows: 3, cols: 3 };
  };

  const gridConfig = getGridConfig(numParts);

  // onClickをpropsから除外（明示的なonClickを優先するため）
  const { onClick: propsOnClick, ...restProps } = props;

  // onClickハンドラーを統合（明示的なonClickを優先、なければprops.onClick）
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      // 引数の有無で判定
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
        "relative h-(--cell-size) w-full min-w-0 p-0 overflow-hidden",
        isSelected && "ring-2 ring-primary",
        className
      )}
      {...restProps}
    >
      {/* グリッドで部位を分割表示 */}
      <div
        className="absolute inset-0 m-px grid"
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
              />
            );
          })}
      </div>

      {/* 日付番号を中央に表示（濃い色で視認性を確保） */}
      <span className="relative z-10 text-sm font-medium text-foreground drop-shadow-md">
        {dayNumber}
      </span>
    </Button>
  );
}
