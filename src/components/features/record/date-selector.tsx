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

interface DateSelectorProps {
  date?: Date;
  onDateChange?: (date: Date) => void;
}

function getTodayEnd(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

function isDateValid(date: Date): boolean {
  return date <= getTodayEnd();
}

export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(date || new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (date) {
      setSelectedDate(date);
    }
  }, [date]);

  const updateDate = (newDate: Date) => {
    if (!isDateValid(newDate)) return;
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handlePreviousDay = () => updateDate(subDays(selectedDate, 1));

  const handleNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (isDateValid(nextDay)) updateDate(nextDay);
  };

  const handleCalendarSelect = (newDate: Date | undefined) => {
    if (newDate) {
      updateDate(newDate);
      setIsCalendarOpen(false);
    }
  };

  const formattedDate = format(selectedDate, "yyyy/M/d");
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const nextDay = addDays(selectedDate, 1);
  const canGoNext = isDateValid(nextDay);

  const isDateDisabled = (date: Date) =>
    isAfter(startOfDay(date), startOfDay(today));

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
