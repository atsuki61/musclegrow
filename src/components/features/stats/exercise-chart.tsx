"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ExerciseProgressData } from "@/types/stats";
import { format } from "date-fns";
import type { Exercise } from "@/types/workout";
import { BODY_PART_COLOR_HEX } from "@/lib/utils";

interface ExerciseChartProps {
  data: ExerciseProgressData[];
  exercise: Exercise | null;
}

/**
 * 種目別グラフコンポーネント
 */
export function ExerciseChart({ data, exercise }: ExerciseChartProps) {
  // グラフ用データを準備
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "MM/dd"),
    fullDate: item.date,
    maxWeight: item.maxWeight,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
        <p className="text-sm">データがありません</p>
        <p className="text-xs mt-1">最大重量が更新された日のみ表示されます</p>
      </div>
    );
  }

  // 種目の部位に応じた色を取得
  const color =
    exercise && exercise.bodyPart !== "other"
      ? (exercise.bodyPart in BODY_PART_COLOR_HEX
          ? BODY_PART_COLOR_HEX[exercise.bodyPart as keyof typeof BODY_PART_COLOR_HEX]
          : "hsl(var(--primary))")
      : "hsl(var(--primary))";

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 40, right: 20, left: 0, bottom: 5 }}
          style={{ cursor: "default" }}
        >
          <defs>
            <linearGradient id="colorExercise" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.1} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            domain={["dataMin - 10", "dataMax + 10"]}
            label={{
              value: "kg",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              padding: "8px 12px",
            }}
            labelStyle={{
              color: "hsl(var(--foreground))",
              fontWeight: 600,
              marginBottom: "4px",
            }}
            itemStyle={{
              color: "hsl(var(--muted-foreground))",
              fontSize: "14px",
            }}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "5 5" }}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.date === label);
              return item ? format(new Date(item.fullDate), "yyyy年MM月dd日") : label;
            }}
            formatter={(value: number) => [`${value.toFixed(1)}kg`, "最大重量"]}
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            stroke={color}
            strokeWidth={3}
            dot={{ r: 5, fill: color, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            activeDot={{ r: 7, strokeWidth: 2 }}
            fill="url(#colorExercise)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

