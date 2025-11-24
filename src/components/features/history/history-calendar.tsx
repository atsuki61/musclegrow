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
    modifiers,
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
    const isToday = modifiers?.today ?? false;

    const handleClick = () => {
      onDateSelect(date);
    };

    // ボタンのサイズ（親のセルサイズに追従させるため h-full w-full）
    const buttonSizeClass = "h-full w-full";

    // 記録がない日のボタン描画
    const renderPlainDayButton = (onClick?: () => void) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn(
          buttonSizeClass,
          "min-w-0 font-normal transition-all duration-200 rounded-md",
          // 選択時のスタイル
          isSelected
            ? "bg-primary text-primary-foreground hover:bg-primary opacity-100 shadow-md scale-105 font-bold ring-0"
            : "hover:bg-muted/50",
          // 今日のスタイル
          !isSelected &&
            isToday &&
            "bg-muted/50 text-foreground font-bold border border-border",
          props.className
        )}
        {...props}
      >
        {date.getDate()}
      </Button>
    );

    // 現在の月以外は薄く表示
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

    // 記録なし
    if (bodyParts.length === 0) {
      return renderPlainDayButton(handleClick);
    }

    // 複数部位（MultiPartDayButton）
    if (bodyParts.length > 1) {
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

    // 単一部位
    const bodyPart = bodyParts[0];
    if (bodyPart === "all") {
      return renderPlainDayButton(handleClick);
    }

    return (
      <MultiPartDayButton
        date={date}
        bodyParts={[bodyPart, bodyPart]}
        isSelected={!!isSelected}
        onClick={handleClick}
        className={cn(buttonSizeClass, props.className)}
        {...props}
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
        // ▼ 修正: セル自体のスタイルも上書きして高さを確保する
        classNames={{
          today: "",

          // テーブル全体のレイアウト
          table: "w-full border-collapse space-y-1",

          // 曜日ヘッダーのセルサイズも合わせる
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-[var(--cell-size)] font-normal text-[0.8rem]",

          // 日付行
          row: "flex w-full mt-2",

          // ★重要★: セル自体にサイズ変数を適用して高さを確保
          cell: "h-[var(--cell-size)] w-[var(--cell-size)] text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",

          // デフォルトのボタンクラス（CustomDayButtonで上書きされるが念のため）
          day: "h-[var(--cell-size)] w-[var(--cell-size)] p-0 font-normal aria-selected:opacity-100",
        }}
        // CSS変数でサイズを指定
        // スマホ: 2.8rem (約45px), タブレット以上: 3.5rem (56px)
        // w-auto inline-block にして中身にフィットさせる
        className="rounded-xl border bg-card shadow-sm w-auto inline-block [--cell-size:2.8rem] sm:[--cell-size:3.5rem] p-3"
      />
    </div>
  );
}

export default React.memo(HistoryCalendar);
