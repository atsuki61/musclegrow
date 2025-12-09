"use client";

import { useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Customized,
} from "recharts";
import type { ExerciseProgressData } from "@/types/stats";
import { format } from "date-fns";
import type { Exercise } from "@/types/workout";
import {
  VerticalReferenceLineComponent,
  SelectionLabel,
  createChartEventHandlers,
} from "./shared-chart-components";
import { useDataPointCoordinates } from "./profile-chart.hooks";
import { calculateYAxisDomain } from "./profile-chart.utils";
import { TrendingUp } from "lucide-react";
// 削除: import { motion } from "framer-motion";

interface CustomizedProps {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface ExerciseChartProps {
  data: ExerciseProgressData[];
  exercise: Exercise | null;
  dataCount?: number;
}

export function ExerciseChart({
  data,
  exercise,
  dataCount,
}: ExerciseChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [enableAnimation, setEnableAnimation] = useState(false);

  const primaryColor = "var(--primary)";
  const gridColor = "var(--border)";
  const textMutedColor = "var(--muted-foreground)";
  const textColor = "var(--foreground)";
  const referenceLineColor = "var(--muted-foreground)";
  const bgColor = "var(--card)";

  useEffect(() => {
    const timer = setTimeout(() => setEnableAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "M/d"),
    fullDate: item.date,
    value: item.maxWeight,
  }));

  const [dataPointCoordinates, collectCoordinate] = useDataPointCoordinates(
    chartData.length
  );

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-card shadow-sm border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {exercise?.name || "種目別"} の推移
          </h3>
        </div>
        <div
          className="flex flex-col items-center justify-center h-[280px]"
          style={{ color: textMutedColor }}
        >
          <p className="text-sm">データがありません</p>
          <p className="text-xs mt-1">最大重量が更新された日のみ表示されます</p>
        </div>
      </div>
    );
  }

  const latestData = chartData[chartData.length - 1];
  const selectedData =
    selectedIndex !== null && selectedIndex < chartData.length
      ? chartData[selectedIndex]
      : latestData;

  const yAxisDomain = calculateYAxisDomain(chartData);

  const chartEventHandlers = createChartEventHandlers(
    dataPointCoordinates,
    setSelectedIndex
  );

  return (
    <div
      className="rounded-2xl bg-card shadow-sm border border-border p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {exercise?.name || "種目別"} の推移
          </h3>
        </div>
        {dataCount !== undefined && (
          <span
            className="text-xs font-medium"
            style={{ color: textMutedColor }}
          >
            {dataCount}件
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative w-full"
        style={{ minHeight: "280px" }}
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 20, left: 0, bottom: 10 }}
            {...chartEventHandlers}
          >
            <defs>
              <filter
                id="shadowPrimary"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="4"
                  floodColor={primaryColor}
                  floodOpacity="0.25"
                />
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              opacity={0.4}
              vertical={true}
            />

            <XAxis
              dataKey="date"
              stroke={gridColor}
              tick={{ fill: textMutedColor, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            />

            <YAxis
              stroke={gridColor}
              tick={{ fill: textMutedColor, fontSize: 11, opacity: 0.6 }}
              tickLine={false}
              axisLine={false}
              domain={yAxisDomain}
              tickCount={3}
              width={35}
            />

            {chartData.length > 1 && (
              <Line
                type="monotone"
                dataKey="value"
                stroke={primaryColor}
                strokeWidth={3}
                dot={false}
                activeDot={false}
                isAnimationActive={enableAnimation}
                animationDuration={500}
              />
            )}

            <Line
              type="monotone"
              dataKey="value"
              stroke="transparent"
              strokeWidth={0}
              isAnimationActive={enableAnimation}
              animationDuration={500}
              dot={(props) => {
                const isSelected = selectedIndex === props.index;
                const { cx, cy, index } = props;

                if (cx === undefined || cy === undefined) return <></>;

                return (
                  //標準のcircleに戻し、CSS transitionで制御
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 7 : 5}
                    style={{
                      fill: isSelected ? primaryColor : bgColor,
                      stroke: primaryColor,
                      // ▼ CSSでアニメーション
                      transition: "r 0.3s ease, fill 0.3s ease",
                    }}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isSelected ? "url(#shadowPrimary)" : undefined}
                    className="cursor-pointer outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (index !== undefined) {
                        setSelectedIndex(index);
                      }
                    }}
                  />
                );
              }}
              activeDot={false}
              label={(props) => {
                collectCoordinate(props);
                return null;
              }}
            />

            {selectedIndex !== null &&
              selectedIndex < dataPointCoordinates.length &&
              dataPointCoordinates[selectedIndex] && (
                <Customized
                  component={(props: CustomizedProps) => (
                    <VerticalReferenceLineComponent
                      width={props.width}
                      height={props.height}
                      margin={props.margin}
                      selectedIndex={selectedIndex}
                      dataPointCoordinates={dataPointCoordinates}
                      referenceLineColor={referenceLineColor}
                    />
                  )}
                />
              )}
          </LineChart>
        </ResponsiveContainer>

        {selectedIndex !== null &&
          selectedIndex < dataPointCoordinates.length &&
          dataPointCoordinates[selectedIndex] &&
          selectedData && (
            <SelectionLabel
              x={dataPointCoordinates[selectedIndex].cx}
              date={selectedData.fullDate}
              value={selectedData.value}
              unit="kg"
              containerWidth={containerRef.current?.offsetWidth || 0}
              color={primaryColor}
            />
          )}
      </div>

      <div
        className="mt-4 pt-4 border-t flex items-center justify-between"
        style={{ borderColor: gridColor }}
      >
        <span className="text-xs" style={{ color: textMutedColor }}>
          最新
        </span>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: primaryColor }}>
            {latestData.value.toFixed(1)}kg
          </span>
          <span className="text-xs" style={{ color: textMutedColor }}>
            {format(new Date(latestData.fullDate), "M月d日")}
          </span>
        </div>
      </div>
    </div>
  );
}
