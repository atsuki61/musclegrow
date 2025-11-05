"use client";

import { DateSelector } from "./date-selector";
import { BodyPartNavigation } from "./body-part-navigation";
import type { BodyPart } from "@/types/workout";

export function RecordPage() {
  const handleDateChange = (date: Date) => {
    // TODO: 日付変更時の処理（後で実装）
    console.log("日付が変更されました:", date);
  };

  const handlePartChange = (part: BodyPart) => {
    // TODO: 部位変更時の処理（後で実装）
    console.log("部位が変更されました:", part);
  };

  return (
    <div className="flex flex-col min-h-screen -mt-14">
      {/* Headerエリア */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="flex h-14 items-center justify-center px-4">
          {/* 日付選択を中央配置 */}
          <DateSelector onDateChange={handleDateChange} />
        </div>
      </header>

      {/* 部位ナビゲーションエリア */}
      <nav className="sticky top-14 z-40 w-full border-b bg-background">
        <div className="px-4">
          <BodyPartNavigation onPartChange={handlePartChange} />
        </div>
      </nav>

      {/* メインコンテンツエリア */}
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* 部位カードは後で実装 */}
          <p className="text-muted-foreground text-center py-8">
            部位カードがここに表示されます
          </p>
        </div>
      </main>
    </div>
  );
}
