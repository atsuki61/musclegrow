"use client";

import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateSelectorProps {
  /** 選択された日付 */
  date?: Date;
  /** 日付変更時のコールバック */
  onDateChange?: (date: Date) => void;
}

/**
 * 日付選択コンポーネント
 * 前日/翌日に移動するボタンと日付表示を提供
 */
export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(date || new Date());

  // 日付を更新する関数
  const updateDate = (newDate: Date) => {
    // 未来の日付は選択不可
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 今日の終わりまで
    if (newDate > today) {
      return;
    }

    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  // 前日に移動
  const handlePreviousDay = () => {
    const previousDay = subDays(selectedDate, 1);
    updateDate(previousDay);
  };

  // 翌日に移動
  const handleNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // 未来の日付は選択不可
    if (nextDay <= today) {
      updateDate(nextDay);
    }
  };

  // 日付フォーマット（2025/11/5）
  const formattedDate = format(selectedDate, "yyyy/M/d");

  // 今日かどうかを判定
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  // 翌日が選択可能かどうかを判定
  const nextDay = addDays(selectedDate, 1);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const canGoNext = nextDay <= todayEnd;

  return (
    <div className="flex items-center gap-2">
      {/* 前日ボタン */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousDay}
        className="h-8 w-8"
        aria-label="前日"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 日付表示 */}
      <button
        onClick={() => {
          // TODO: カレンダーダイアログを表示（後で実装）
        }}
        className="text-lg font-semibold px-2 py-1 hover:bg-muted rounded-md transition-colors"
        aria-label={`日付を選択: ${formattedDate}`}
      >
        {formattedDate}
        {isToday && (
          <span className="ml-1 text-xs text-muted-foreground">(今日)</span>
        )}
      </button>

      {/* 翌日ボタン */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextDay}
        className="h-8 w-8"
        disabled={!canGoNext}
        aria-label="翌日"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
