import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface BodyPart {
  name: string;
  color: string;
}

export function TodayMenuCard() {
  const dayOfWeek = new Date().getDay();

  const weeklyPlan: BodyPart[][] = [
    [{ name: "休息日", color: "bg-gray-500" }],
    [{ name: "胸", color: "bg-red-500" }],
    [{ name: "腕", color: "bg-purple-500" }],
    [{ name: "背中", color: "bg-blue-500" }],
    [{ name: "肩", color: "bg-yellow-500" }],
    [{ name: "脚", color: "bg-green-500" }],
    [{ name: "体幹", color: "bg-orange-500" }],
  ];

  const todayParts = weeklyPlan[dayOfWeek];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* タイトル行 */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">今日のメニュー</h3>
        </div>

        {/* 部位バッジの表示 */}
        <div className="flex flex-wrap gap-2">
          {todayParts.map((part, index) => (
            <Badge
              key={index}
              className={`${part.color} text-white text-base px-3 py-1`}
            >
              {part.name}
            </Badge>
          ))}
        </div>

        {/* メッセージ */}
        <p className="text-sm text-muted-foreground">
          {todayParts[0].name === "休息日"
            ? "今日は休息日です。しっかり回復しましょう💤"
            : "今日のターゲット部位で記録しましょう！"}
        </p>
      </CardContent>
    </Card>
  );
}
