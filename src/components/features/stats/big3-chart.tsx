"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Big3ProgressData } from "@/types/stats";
import { format } from "date-fns";
import { BODY_PART_COLOR_HEX } from "@/lib/utils";

interface Big3ChartProps {
  data: Big3ProgressData;
}

/**
 * Big3グラフコンポーネント
 */
export function Big3Chart({ data }: Big3ChartProps) {
  // 全データポイントを日付でソートして統合
  const allDates = new Set<string>();
  data.benchPress.forEach((item) => allDates.add(item.date));
  data.squat.forEach((item) => allDates.add(item.date));
  data.deadlift.forEach((item) => allDates.add(item.date));

  const sortedDates = Array.from(allDates).sort();

  // グラフ用データを準備
  const chartData = sortedDates.map((date) => {
    const benchPress = data.benchPress.find((d) => d.date === date);
    const squat = data.squat.find((d) => d.date === date);
    const deadlift = data.deadlift.find((d) => d.date === date);

    return {
      date: format(new Date(date), "MM/dd"),
      fullDate: date,
      benchPress: benchPress?.maxWeight ?? null,
      squat: squat?.maxWeight ?? null,
      deadlift: deadlift?.maxWeight ?? null,
    };
  });

  const hasData =
    data.benchPress.length > 0 ||
    data.squat.length > 0 ||
    data.deadlift.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
        <p className="text-sm">データがありません</p>
        <p className="text-xs mt-1">最大重量が更新された日のみ表示されます</p>
      </div>
    );
  }

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 40, right: 20, left: 0, bottom: 5 }}
          style={{ cursor: "default" }}
        >
          <defs>
            <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BODY_PART_COLOR_HEX.chest} stopOpacity={0.1} />
              <stop offset="95%" stopColor={BODY_PART_COLOR_HEX.chest} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSquat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BODY_PART_COLOR_HEX.legs} stopOpacity={0.1} />
              <stop offset="95%" stopColor={BODY_PART_COLOR_HEX.legs} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDeadlift" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BODY_PART_COLOR_HEX.back} stopOpacity={0.1} />
              <stop offset="95%" stopColor={BODY_PART_COLOR_HEX.back} stopOpacity={0} />
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
              fontSize: "14px",
            }}
            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "5 5" }}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.date === label);
              return item ? format(new Date(item.fullDate), "yyyy年MM月dd日") : label;
            }}
            formatter={(value) => {
              if (value === null || value === undefined) return ["-", ""];
              const numValue = typeof value === "number" ? value : parseFloat(String(value));
              if (isNaN(numValue)) return ["-", ""];
              return [`${numValue.toFixed(1)}kg`, ""];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="line"
            formatter={(value) => {
              const labels: Record<string, string> = {
                benchPress: "ベンチプレス",
                squat: "スクワット",
                deadlift: "デッドリフト",
              };
              return labels[value] || value;
            }}
          />
          {data.benchPress.length > 0 && (
            <Line
              type="monotone"
              dataKey="benchPress"
              stroke={BODY_PART_COLOR_HEX.chest}
              strokeWidth={3}
              dot={{ r: 5, fill: BODY_PART_COLOR_HEX.chest, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              activeDot={{ r: 7, strokeWidth: 2 }}
              connectNulls={false}
            />
          )}
          {data.squat.length > 0 && (
            <Line
              type="monotone"
              dataKey="squat"
              stroke={BODY_PART_COLOR_HEX.legs}
              strokeWidth={3}
              dot={{ r: 5, fill: BODY_PART_COLOR_HEX.legs, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              activeDot={{ r: 7, strokeWidth: 2 }}
              connectNulls={false}
            />
          )}
          {data.deadlift.length > 0 && (
            <Line
              type="monotone"
              dataKey="deadlift"
              stroke={BODY_PART_COLOR_HEX.back}
              strokeWidth={3}
              dot={{ r: 5, fill: BODY_PART_COLOR_HEX.back, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              activeDot={{ r: 7, strokeWidth: 2 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

