"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, isAfter, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DateSelectorProps {
  /** 選択された日付 */
  date?: Date;
  /** 日付変更時のコールバック */
  onDateChange?: (date: Date) => void;
}

/**
 * 今日の終わりの時刻（23:59:59.999）を取得する
 */
function getTodayEnd(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

/**
 * 日付が有効かどうかを判定する（未来の日付は無効）
 */
function isDateValid(date: Date): boolean {
  return date <= getTodayEnd();
}

/**
 * 日付選択コンポーネント
 * 前日/翌日に移動するボタンと日付表示を提供
 * 日付をクリックするとカレンダーダイアログが表示される
 */
export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(date || new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // propsのdateが変更されたときに内部状態を更新
  useEffect(() => {
    if (date) {
      setSelectedDate(date);
    }
  }, [date]);

  // 日付を更新する関数
  const updateDate = (newDate: Date) => {
    if (!isDateValid(newDate)) {
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
    if (isDateValid(nextDay)) {
      updateDate(nextDay);
    }
  };

  // カレンダーで日付を選択したときの処理
  const handleCalendarSelect = (newDate: Date | undefined) => {
    if (newDate) {
      updateDate(newDate);
      setIsCalendarOpen(false);
    }
  };

  // 日付フォーマット（2025/11/5）
  const formattedDate = format(selectedDate, "yyyy/M/d");

  // 今日かどうかを判定
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  // 翌日が選択可能かどうかを判定
  const nextDay = addDays(selectedDate, 1);
  const canGoNext = isDateValid(nextDay);

  // 未来の日付を無効化する関数
  const isDateDisabled = (date: Date) => {
    return isAfter(startOfDay(date), startOfDay(today));
  };

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

      {/* カレンダーダイアログ */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            className="text-lg font-semibold px-2 py-1 hover:bg-muted rounded-md transition-colors"
            aria-label={`日付を選択: ${formattedDate}`}
          >
            {formattedDate}
            {isToday && (
              <span className="ml-1 text-xs text-muted-foreground">(今日)</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            disabled={isDateDisabled}
            locale={ja}
            initialFocus
          />
        </PopoverContent>
      </Popover>

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
