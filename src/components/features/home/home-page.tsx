import { TotalDaysBadge } from "./total-days-badge";
import { TodayMenuCard } from "./today-menu-card";
import { TodayTipsCard } from "./today-tips-card";

export function HomePage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 合計記録日数（モックデータ） */}
      <TotalDaysBadge days={180} />

      {/* 今日のメニュー */}
      <TodayMenuCard />

      {/* 今日のTips */}
      <TodayTipsCard />
    </div>
  );
}
