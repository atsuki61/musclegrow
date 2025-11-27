"use client";

import React, { useCallback } from "react";
import { format, isSameMonth, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { DayButton } from "react-day-picker";
import type { DayButtonProps } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
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
    bodyParts,
    isSelected,
    onDateSelect,
    isCurrentMonth,
    ...props
  }: DayButtonProps & {
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

    // 現在の月以外は非表示にする（レイアウト崩れ防止のためinvisible）
    if (!isCurrentMonth) {
      return <div className={cn(buttonSizeClass, "invisible")} />;
    }

    // 記録の有無に関わらず、すべて MultiPartDayButton で統一して描画
    // MultiPartDayButton内で isSelected の時は bg-primary 等が適用される想定
    return (
      <MultiPartDayButton
        date={date}
        bodyParts={bodyParts}
        isSelected={!!isSelected}
        onClick={handleClick}
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
      return parts.includes(filteredBodyPart) ? parts : [];
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
          today: "text-primary font-bold", // 今日の日付をテーマ色で強調

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

          // セル: サイズ固定
          cell: "h-[var(--cell-size)] w-[var(--cell-size)] flex-none text-center text-sm p-0 relative focus-within:relative focus-within:z-20",

          // デフォルトボタン
          day: "h-[var(--cell-size)] w-[var(--cell-size)] p-0 font-normal aria-selected:opacity-100 hover:bg-muted/50 rounded-md transition-colors",
        }}
        // サイズ指定
        className="rounded-xl border bg-card shadow-sm w-auto inline-block [--cell-size:3.4rem] sm:[--cell-size:3.5rem] p-3"
      />
    </div>
  );
}

export default React.memo(HistoryCalendar);
