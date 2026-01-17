"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, isAfter, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// 日付セレクターのプロパティ
interface DateSelectorProps {
  date?: Date;
  onDateChange?: (date: Date) => void;
}

// 今日の終了時刻を取得
function getTodayEnd(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

// 日付が有効かどうかを判断
function isDateValid(date: Date): boolean {
  return date <= getTodayEnd();
}

// 日付セレクターのコンポーネント
export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(date || new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 日付が変更された場合、選択された日付を更新
  useEffect(() => {
    if (date) {
      setSelectedDate(date);
    }
  }, [date]);

  // 日付を更新
  const updateDate = (newDate: Date) => {
    if (!isDateValid(newDate)) return;
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };
  // 前日を選択
  const handlePreviousDay = () => updateDate(subDays(selectedDate, 1));

  // 翌日を選択
  const handleNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (isDateValid(nextDay)) updateDate(nextDay);
  };

  // カレンダーで日付が選択された場合、日付を更新
  const handleCalendarSelect = (newDate: Date | undefined) => {
    if (newDate) {
      updateDate(newDate);
      setIsCalendarOpen(false);
    }
  };

  // 日付をフォーマット
  const formattedDate = format(selectedDate, "yyyy/M/d"); //yyyy/M/d: 2026/1/3 という形式でフォーマット
  const today = new Date(); //今日の日付
  const isToday = selectedDate.toDateString() === today.toDateString(); //選択された日付と今日の日付が同じかどうかを判断
  const nextDay = addDays(selectedDate, 1); //翌日の日付
  const canGoNext = isDateValid(nextDay); //翌日の日付が有効かどうかを判断

  const isDateDisabled = (date: Date) =>
    isAfter(startOfDay(date), startOfDay(today)); //日付が無効かどうかを判断

  // 日付セレクターのコンポーネントを返す
  return (
    <div className="flex items-center justify-between bg-muted/30 rounded-full p-1 px-2 border border-border/50 min-w-[200px]">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousDay}
        className="h-8 w-8 rounded-full hover:bg-background hover:shadow-sm"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-md hover:bg-background/50 transition-colors active:scale-95">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span>
              {formattedDate}
              {isToday && (
                <span className="ml-1.5 text-xs font-normal text-primary">
                  (今日)
                </span>
              )}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 shadow-xl rounded-xl border-none"
          align="center"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            disabled={isDateDisabled}
            locale={ja}
            initialFocus
            className="rounded-xl border bg-card"
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextDay}
        className="h-8 w-8 rounded-full hover:bg-background hover:shadow-sm disabled:opacity-30"
        disabled={!canGoNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
