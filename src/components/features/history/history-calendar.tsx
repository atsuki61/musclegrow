"use client";

import { format, isSameMonth, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { DayButton } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { MultiPartDayButton } from "./multi-part-day-button";
import { cn } from "@/lib/utils";
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
    const bodyParts = bodyPartsByDate[dateStr] || [];
    return bodyParts;
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

    // 通常の日付ボタンをレンダリング（共通処理）
    const renderPlainDayButton = (onClick?: () => void) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn(
          "h-(--cell-size) w-full min-w-0",
          isSelected && "ring-2 ring-primary",
          isToday && "bg-transparent",
          props.className
        )}
        {...props}
      >
        {date.getDate()}
      </Button>
    );

    // 現在の月以外の日付は通常表示（react-day-pickerが処理）
    if (!isCurrentMonth) {
      return (
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-(--cell-size) w-full min-w-0", props.className)}
          {...props}
        >
          {date.getDate()}
        </Button>
      );
    }

    // 部位がない日付は通常表示
    if (bodyParts.length === 0) {
      return renderPlainDayButton(() => onDateSelect(date));
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

    // 単一部位の場合は色付け（MultiPartDayButtonを使用して統一）
    const bodyPart = bodyParts[0];
    // "all"の場合は色付けしない（通常表示）
    if (bodyPart === "all") {
      return renderPlainDayButton(() => onDateSelect(date));
    }

    // 1種目の場合もMultiPartDayButtonを使用（同じ色を2分割表示）
    return (
      <MultiPartDayButton
        date={date}
        bodyParts={[bodyPart, bodyPart]}
        isSelected={isSelected || false}
        onClick={() => onDateSelect(date)}
        className={props.className}
        {...props}
      />
    );
  };

  return (
    <div className="w-full">
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
          today: "", // todayスタイルを無効化（色付けを優先）
          root: "h-auto", // ルート要素の高さを自動に
          months: "h-auto", // 月表示の高さを自動に
        }}
        className="rounded-md border w-full [--cell-size:3rem] h-auto overflow-hidden"
      />
    </div>
  );
}
