"use client";

import React, { useCallback } from "react";
import { format, addMonths, subMonths, isSameMonth, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { DayPicker, DayButton } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

    const sizeClasses =
      "h-10 w-10 sm:h-12 sm:w-12 text-sm p-0 rounded-md overflow-hidden";

    const renderPlainDayButton = (onClick?: () => void) => (
      <Button
        variant={isSelected ? "default" : "ghost"}
        size="icon"
        onClick={onClick}
        className={cn(
          sizeClasses,
          "font-normal transition-all duration-200",
          isSelected
            ? "bg-primary text-primary-foreground hover:bg-primary shadow-md scale-105 font-bold z-10 ring-0"
            : "hover:bg-muted/50",
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
        <div
          className={cn(
            sizeClasses,
            "flex items-center justify-center opacity-20"
          )}
        >
          {date.getDate()}
        </div>
      );
    }

    if (bodyParts.length === 0) {
      return renderPlainDayButton(handleClick);
    }

    return (
      <div
        className={cn(
          "relative",
          sizeClasses,
          isSelected && "ring-2 ring-primary ring-offset-1 z-10 rounded-md"
        )}
      >
        <MultiPartDayButton
          date={date}
          bodyParts={bodyParts}
          isSelected={!!isSelected}
          onClick={handleClick}
          className="w-full h-full rounded-md"
        />
      </div>
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

  const handlePreviousMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (
      !isFutureDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1))
    ) {
      onMonthChange(nextMonth);
    }
  };

  const canGoNext = !isFutureDate(
    new Date(
      addMonths(currentMonth, 1).getFullYear(),
      addMonths(currentMonth, 1).getMonth(),
      1
    )
  );

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
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 inline-block min-w-min">
        {/* 自作ヘッダー */}
        <div className="flex items-center justify-between mb-4 px-2 w-full max-w-md mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="h-9 w-9 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-lg font-bold tracking-tight text-foreground">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className={cn(
              "h-9 w-9 rounded-full hover:bg-muted",
              !canGoNext && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <DayPicker
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(date) => date && onDateSelect(date)}
          month={currentMonth}
          onMonthChange={() => {}}
          disabled={isDateDisabled}
          locale={ja}
          fixedWeeks={true}
          showOutsideDays={false}
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
          // [&_.rdp-nav]:hidden -> ナビゲーション削除
          // [&_.rdp-month_caption]:hidden -> 年月表示削除
          // [&_.rdp-caption_label]:hidden -> テキスト削除
          className="m-0 [&_.rdp-nav]:hidden [&_.rdp-month_caption]:hidden [&_.rdp-caption_label]:hidden"
          classNames={{
            months: "flex flex-col",
            month: "space-y-2",

            // こちらでも念のため指定
            nav: "hidden",
            caption: "hidden",
            month_caption: "hidden",
            caption_label: "hidden",

            table: "w-full border-collapse",
            head_row: "flex mb-2",
            head_cell:
              "text-muted-foreground rounded-md w-10 sm:w-12 font-medium text-[0.8rem] h-8 flex items-center justify-center",
            row: "flex w-full mt-2",
            cell: "h-10 w-10 sm:h-12 sm:w-12 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: "h-full w-full p-0 font-normal aria-selected:opacity-100",
          }}
        />
      </div>
    </div>
  );
}

export default React.memo(HistoryCalendar);
