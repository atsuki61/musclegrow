"use client";

import { format, isSameMonth, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { DayButton } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { MultiPartDayButton } from "./multi-part-day-button";
import { BODY_PART_COLOR_HEX, getLightBackgroundColor, cn } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";

interface HistoryCalendarProps {
  /** 現在表示している月 */
  currentMonth: Date;
  /** 月変更時のコールバック */
  onMonthChange: (month: Date) => void;
  /** 日付ごとの部位一覧（日付文字列をキー、部位配列を値） */
  bodyPartsByDate: Record<string, BodyPart[]>;
  /** 選択された日付 */
  selectedDate: Date | null;
  /** 日付選択時のコールバック */
  onDateSelect: (date: Date) => void;
  /** フィルタリングする部位（"all"の場合はフィルタリングなし） */
  filteredBodyPart?: BodyPart;
}

/**
 * 履歴ページ用カレンダーコンポーネント
 * 日付ごとの部位を色付けして表示
 */
export function HistoryCalendar({
  currentMonth,
  onMonthChange,
  bodyPartsByDate,
  selectedDate,
  onDateSelect,
  filteredBodyPart = "all",
}: HistoryCalendarProps) {
  // 日付の部位を取得
  const getBodyPartsForDate = (date: Date): BodyPart[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bodyPartsByDate[dateStr] || [];
  };

  // フィルタリング後の部位を取得
  const getFilteredBodyParts = (date: Date): BodyPart[] => {
    const bodyParts = getBodyPartsForDate(date);
    if (filteredBodyPart === "all") {
      return bodyParts;
    }
    // 選択された部位を含む日付のみ表示
    return bodyParts.includes(filteredBodyPart) ? bodyParts : [];
  };

  // カスタムDayButtonコンポーネント
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

    // 現在の月以外の日付は通常表示（react-day-pickerが処理）
    if (!isCurrentMonth) {
      return (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "aspect-square w-full min-w-[--cell-size]",
            props.className
          )}
          {...props}
        >
          {date.getDate()}
        </Button>
      );
    }

    // 部位がない日付は通常表示
    if (bodyParts.length === 0) {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateSelect(date)}
          className={cn(
            "aspect-square w-full min-w-[--cell-size]",
            isSelected && "bg-primary text-primary-foreground",
            // todayスタイルを無効化
            isToday && "bg-transparent",
            props.className
          )}
          {...props}
        >
          {date.getDate()}
        </Button>
      );
    }

    // 複数部位の場合は分割表示
    if (bodyParts.length > 1) {
      return (
        <MultiPartDayButton
          date={date}
          bodyParts={bodyParts}
          isSelected={isSelected || false}
          onClick={() => onDateSelect(date)}
          className={props.className}
        />
      );
    }

    // 単一部位の場合は色付け（薄い色）
    const bodyPart = bodyParts[0];
    const colorHex = BODY_PART_COLOR_HEX[bodyPart as Exclude<BodyPart, "all">];
    const lightColorHex = getLightBackgroundColor(colorHex);

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDateSelect(date)}
        className={cn(
          "aspect-square w-full min-w-[--cell-size]",
          isSelected && "ring-2 ring-primary ring-offset-2",
          // todayスタイルを無効化（色付けを優先）
          isToday && "bg-transparent",
          props.className
        )}
        style={{
          backgroundColor: lightColorHex,
          color: colorHex, // 文字色は濃い部位色
        }}
        {...props}
      >
        {date.getDate()}
      </Button>
    );
  };

  return (
    <div className="mb-6 w-full">
      <Calendar
        mode="single"
        selected={selectedDate || undefined}
        onSelect={(date) => date && onDateSelect(date)}
        month={currentMonth}
        onMonthChange={onMonthChange}
        locale={ja}
        components={{
          DayButton: CustomDayButton,
        }}
        classNames={{
          today: "bg-transparent hover:bg-transparent", // todayスタイルを無効化（選択された日付のみハイライト）
        }}
        className="rounded-md border w-full [--cell-size:3rem]"
      />
    </div>
  );
}
