"use client";

import React, { useCallback } from "react";
import { format, isSameMonth, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { DayButton } from "react-day-picker";
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
    // modifiers は使用しないため削除
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

    // 親セル(td)のサイズに追従させるクラス
    const buttonSizeClass = "h-full w-full";

    const handleClick = () => {
      onDateSelect(date);
    };

    // ▼ 修正箇所: 現在の月以外は非表示にする
    // invisible を指定することで、スペースは確保しつつ姿を消す（レイアウト崩れ防止）
    if (!isCurrentMonth) {
      return <div className={cn(buttonSizeClass, "invisible")} />;
    }

    // 2. 記録の有無に関わらず、すべて MultiPartDayButton で統一して描画
    // 記録がない日も「透明なグリッド」として同じサイズ・挙動になる

    // 単一部位の場合の処理 ("all" の扱いなど)
    const partsToRender = bodyParts;

    // もし単一部位で "all" だった場合、特定の処理が必要なければそのまま渡す
    // ここでは統一感のため、特別な分岐を削除し、全てMultiPartDayButtonに委ねます

    return (
      <MultiPartDayButton
        date={date}
        bodyParts={partsToRender}
        isSelected={!!isSelected}
        onClick={handleClick}
        // h-full w-full を渡して親セルいっぱいに広げる
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
          today: "",

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

          // セル: サイズ固定 + Flex制御なし (flex-none) でサイズを死守
          cell: "h-[var(--cell-size)] w-[var(--cell-size)] flex-none text-center text-sm p-0 relative focus-within:relative focus-within:z-20",

          // デフォルトボタン
          day: "h-[var(--cell-size)] w-[var(--cell-size)] p-0 font-normal aria-selected:opacity-100",
        }}
        // サイズ指定
        // スマホ: 3.4rem, タブレット以上: 3.5rem
        className="rounded-xl border bg-card shadow-sm w-auto inline-block [--cell-size:3.4rem] sm:[--cell-size:3.5rem] p-3"
      />
    </div>
  );
}

export default React.memo(HistoryCalendar);
