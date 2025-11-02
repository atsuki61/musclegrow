import { TotalDaysBadge } from "./total-days-badge";
import { TodayMenuCard } from "./today-menu-card";
import { TodayTipsCard } from "./today-tips-card";
import { Big3Progress } from "./big3-progress";

export function HomePage() {
  // ダミーデータ（将来的にはAPIから取得）
  const big3Data = {
    benchPress: {
      name: "ベンチプレス",
      current: 90,
      target: 100,
      color: "bg-red-500",
    },
    squat: {
      name: "スクワット",
      current: 100,
      target: 120,
      color: "bg-green-500",
    },
    deadlift: {
      name: "デッドリフト",
      current: 120,
      target: 140,
      color: "bg-blue-500",
    },
  };
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 合計記録日数（モックデータ） */}
      <TotalDaysBadge days={180} />
      <Big3Progress
        benchPress={big3Data.benchPress}
        squat={big3Data.squat}
        deadlift={big3Data.deadlift}
      />
      {/* 今日のメニュー */}
      <TodayMenuCard />

      {/* 今日のTips */}
      <TodayTipsCard />
    </div>
  );
}
