"use client";

import { format, isSameMonth, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { DayButton } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import MultiPartDayButton from "./multi-part-day-button";
import { cn, isFutureDate } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";
import React from "react";

interface HistoryCalendarProps {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  bodyPartsByDate: Record<string, BodyPart[]>;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  filteredBodyPart?: BodyPart;
}

/**
 * 履歴ページ用カレンダーコンポーネント
 * 日付ごとの部位を色付けして表示
 */
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

  const getBodyPartsForDate = (date: Date): BodyPart[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bodyPartsByDate[dateStr] || [];
  };

  const getFilteredBodyParts = (date: Date): BodyPart[] => {
    const bodyParts = getBodyPartsForDate(date);
    if (filteredBodyPart === "all") return bodyParts;
    return bodyParts.includes(filteredBodyPart) ? bodyParts : [];
  };

  const CustomDayButton = ({
    day,
    modifiers,
    ...props
  }: React.ComponentProps<typeof DayButton>) => {
    const date = day.date;
    const bodyParts = getFilteredBodyParts(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isToday = modifiers?.today ?? false;

    // 記録がない日のボタン描画
    const renderPlainDayButton = (onClick?: () => void) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn(
          // h-(--cell-size) だと効かない場合があるため h-[var(--cell-size)] に修正
          "h-[var(--cell-size)] w-full min-w-0 font-normal transition-all duration-200",
          // ▼ 修正箇所: 選択時のスタイルを強化（背景色・文字色・影を追加）
          isSelected
            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground opacity-100 shadow-md scale-105 font-bold ring-0"
            : "hover:bg-muted/50",
          // 今日のスタイル（未選択時）
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

    if (!isCurrentMonth) {
      return (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-[var(--cell-size)] w-full min-w-0 opacity-30 cursor-default hover:bg-transparent",
            props.className
          )}
          {...props}
        >
          {date.getDate()}
        </Button>
      );
    }

    if (bodyParts.length === 0) {
      return renderPlainDayButton(() => onDateSelect(date));
    }

    if (bodyParts.length > 1) {
      return (
        <MultiPartDayButton
          date={date}
          bodyParts={bodyParts}
          isSelected={!!isSelected}
          onClick={() => onDateSelect(date)}
          className={props.className}
        />
      );
    }

    const bodyPart = bodyParts[0];
    if (bodyPart === "all") {
      return renderPlainDayButton(() => onDateSelect(date));
    }

    return (
      <MultiPartDayButton
        date={date}
        bodyParts={[bodyPart, bodyPart]}
        isSelected={!!isSelected}
        onClick={() => onDateSelect(date)}
        className={props.className}
        {...props}
      />
    );
  };

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
          DayButton: CustomDayButton,
        }}
        classNames={{
          today: "", // CustomDayButton側で制御するためリセット
        }}
        // CSS変数を直接指定して高さを確保
        className="rounded-xl border bg-card shadow-sm w-full [--cell-size:3rem] sm:[--cell-size:3.5rem] p-3"
      />
    </div>
  );
}

export default React.memo(HistoryCalendar);
