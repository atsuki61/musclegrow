"use client";

import React, { useCallback } from "react";
import { format, isSameMonth, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { DayButton } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn, isFutureDate } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";
import MultiPartDayButton from "./multi-part-day-button";

interface HistoryCalendarProps {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  bodyPartsByDate: Record<string, BodyPart[]>;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  filteredBodyPart?: BodyPart;
}

/**
 * カスタム日付ボタンコンポーネント
 * パフォーマンス向上のため外に出してメモ化
 */
const CustomDayButton = React.memo(
  ({
    day,
    // modifiers は未使用のため削除して警告回避
    bodyParts,
    isSelected,
    onDateSelect,
    isCurrentMonth,
    ...props
  }: React.ComponentProps<typeof DayButton> & {
    bodyParts: BodyPart[];
    isSelected: boolean;
    onDateSelect: (date: Date) => void;
    isCurrentMonth: boolean;
  }) => {
    const date = day.date;

    // 親セル(td)のサイズに追従させるクラス
    const buttonSizeClass = "h-full w-full";

    const handleClick = () => {
      onDateSelect(date);
    };

    // 1. 現在の月以外は薄く表示（ポインターイベント無効化）
    if (!isCurrentMonth) {
      return (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            buttonSizeClass,
            "min-w-0 opacity-30 cursor-default hover:bg-transparent",
            props.className
          )}
          {...props}
        >
          {date.getDate()}
        </Button>
      );
    }

    // 2. 単一部位の場合は、4つに複製してグリッド全体を埋める配列を作成
    // これにより、1種目だけの日は「全塗り」に見えるようになる
    let partsToRender = bodyParts;
    if (bodyParts.length === 1) {
      const p = bodyParts[0];
      partsToRender = [p, p, p, p];
    }

    // 3. 記録の有無に関わらず、すべて MultiPartDayButton で統一して描画
    // 記録がない場合は空配列が渡され、MultiPartDayButton側で空グリッド（透明）として描画される
    return (
      <MultiPartDayButton
        date={date}
        bodyParts={partsToRender}
        isSelected={!!isSelected}
        onClick={handleClick}
        // h-full w-full を渡して親セルいっぱいに広げる
        className={cn(buttonSizeClass, props.className)}
      />
    );
  }
);

CustomDayButton.displayName = "CustomDayButton";

function HistoryCalendar({
  currentMonth,
  onMonthChange,
  bodyPartsByDate,
  selectedDate,
  onDateSelect,
  filteredBodyPart = "all",
}: HistoryCalendarProps) {
  const isDateDisabled = (date: Date) => isFutureDate(date);

  const handleMonthChange = (date: Date) => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    if (isFutureDate(monthStart)) return;
    onMonthChange(date);
  };

  // データを取得する関数をメモ化
  const getBodyParts = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const parts = bodyPartsByDate[dateStr] || [];

      if (filteredBodyPart === "all") return parts;

      // フィルター選択時は、その部位が含まれているかチェックし、
      // 含まれていれば「その部位だけ」を返す（＝カレンダー上はその色一色になる）
      return parts.includes(filteredBodyPart) ? [filteredBodyPart] : [];
    },
    [bodyPartsByDate, filteredBodyPart]
  );

  return (
    <div className="w-full flex justify-center">
      <Calendar
        mode="single"
        selected={selectedDate || undefined}
        onSelect={(date) => date && onDateSelect(date)}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        disabled={isDateDisabled}
        locale={ja}
        fixedWeeks={true}
        components={{
          DayButton: (props) => (
            <CustomDayButton
              {...props}
              bodyParts={getBodyParts(props.day.date)}
              isSelected={
                !!(selectedDate && isSameDay(props.day.date, selectedDate))
              }
              onDateSelect={onDateSelect}
              isCurrentMonth={isSameMonth(props.day.date, currentMonth)}
            />
          ),
        }}
        classNames={{
          today: "",

          // 月の表示サイズ
          caption_label: "text-xl font-bold",

          // テーブルレイアウト
          table: "w-full border-collapse space-y-1",

          // 曜日ヘッダー
          head_row: "flex mb-2",
          head_cell:
            "text-muted-foreground rounded-md w-[var(--cell-size)] font-normal text-[0.8rem] flex items-center justify-center flex-none",

          // 日付行
          row: "flex w-full mt-2",

          // セル: サイズ固定 + Flex制御なし (flex-none) でサイズを死守
          cell: "h-[var(--cell-size)] w-[var(--cell-size)] flex-none text-center text-sm p-0 relative focus-within:relative focus-within:z-20",

          // デフォルトボタン
          day: "h-[var(--cell-size)] w-[var(--cell-size)] p-0 font-normal aria-selected:opacity-100",
        }}
        // サイズ指定
        // スマホ: 3rem (48px), タブレット以上: 3.5rem (56px)
        className="rounded-xl border bg-card shadow-sm w-auto inline-block [--cell-size:3.4rem] sm:[--cell-size:3.5rem] p-3"
      />
    </div>
  );
}

export default React.memo(HistoryCalendar);
