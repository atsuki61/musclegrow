import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function TodayTipsCard() {
  const dayOfMonth = new Date().getDate();

  const tipsList = [
    "トレーニング前に軽くストレッチをしましょう",
    "タンパク質は体重×1.5〜2gを目安に摂取",
    "十分な睡眠が筋肉の成長に不可欠です",
    "水分補給を忘れずに！1日2L以上が目安",
    "フォームが悪いと怪我の原因に。正しい姿勢を意識",
    "週に1〜2日は完全休養日を設けましょう",
    "高負荷トレーニング後はクールダウンを忘れずに",
    "同じ部位は48〜72時間空けて回復させる",
    "プロテインは運動後30分以内の摂取が効果的",
    "無理な重量より、正確な動作を優先しよう",
    "呼吸を止めずに、リズムよくトレーニング",
    "筋肉痛がひどい時は無理せず休養を",
    "バランスの良い食事が筋肉作りの基本",
    "記録をつけることでモチベーション維持",
  ];

  const todayTip = tipsList[dayOfMonth % tipsList.length];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* タイトル行 */}
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">今日のTips</h3>
        </div>

        {/*tipsメッセージ*/}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {todayTip}
        </p>
      </CardContent>
    </Card>
  );
}
