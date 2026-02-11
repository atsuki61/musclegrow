"use client";

import { useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Customized,
} from "recharts";
import type { ProfileHistoryData, ProfileChartType } from "@/types/stats";
import { format } from "date-fns";
import {
  CHART_LABELS,
  CHART_UNITS,
  CHART_ICONS,
} from "./profile-chart.constants";
import {
  transformChartData,
  calculateXAxisDomain,
  calculateYAxisDomain,
  calculateVisibleXAxisTicks,
} from "./profile-chart.utils";
import { useDataPointCoordinates } from "./profile-chart.hooks";
import {
  VerticalReferenceLineComponent,
  SelectionLabel,
  createChartEventHandlers,
} from "./shared-chart-components";
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

interface ProfileChartProps {
  data: ProfileHistoryData[];
  chartType: ProfileChartType;
  dataCount?: number;
}

export function ProfileChart({
  data,
  chartType,
  dataCount,
}: ProfileChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [enableAnimation, setEnableAnimation] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  // コンテナの幅を取得
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);
    return () => window.removeEventListener("resize", updateContainerWidth);
  }, []);

  // 初期スクロール位置を右端（最新データ）に設定
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  }, [data]);

  // スクロールイベントを監視
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const chartData = transformChartData(data, chartType);
  const [dataPointCoordinates, collectCoordinate] = useDataPointCoordinates(
    chartData.length
  );

  // グラフの幅を計算（データ数に応じて）
  const MIN_VISIBLE_POINTS = 10; // 最小表示データ数
  const PADDING = 40; // 左右のパディング合計
  const CELL_WIDTH =
    containerWidth > 0
      ? Math.max(38, (containerWidth - PADDING) / MIN_VISIBLE_POINTS)
      : 60; // コンテナ幅に基づいて計算、最小40px
  const chartWidth = chartData.length * CELL_WIDTH;

  const Icon = CHART_ICONS[chartType];

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-card shadow-sm border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {CHART_LABELS[chartType]}
          </h3>
        </div>
        <div
          className="flex flex-col items-center justify-center h-[280px]"
          style={{ color: textMutedColor }}
        >
          <p className="text-sm">データがありません</p>
          <p className="text-xs mt-1">プロフィール更新時に自動記録されます</p>
        </div>
      </div>
    );
  }

  const latestData = chartData[chartData.length - 1];
  const selectedData =
    selectedIndex !== null && selectedIndex < chartData.length
      ? chartData[selectedIndex]
      : latestData;

  const xAxisDomain = calculateXAxisDomain(chartData);
  const yAxisDomain = calculateYAxisDomain(chartData);

  // 表示するX軸のticksを動的に計算
  const { indices: visibleXAxisIndices, yearChangeIndices } =
    calculateVisibleXAxisTicks(
      chartData,
      scrollLeft,
      containerWidth,
      chartWidth,
      CELL_WIDTH
    );

  // インデックスから実際の日付値に変換
  const visibleXAxisTicks = visibleXAxisIndices.map((i) => chartData[i].date);

  // カスタムtickコンポーネント
  const CustomTick = (props: {
    x?: number;
    y?: number;
    payload?: { value: string };
  }) => {
    const { x, y, payload } = props;

    if (!payload || x === undefined || y === undefined) return null;

    const index = chartData.findIndex((d) => d.date === payload.value);

    // 年の区切りの場合は年を表示
    if (index !== -1 && yearChangeIndices.has(index)) {
      const year = new Date(chartData[index].fullDate).getFullYear();
      return (
        <g transform={`translate(${x},${y})`}>
          <text
            x={0}
            y={0}
            dy={16}
            textAnchor="middle"
            fill={textMutedColor}
            fontSize={10}
            fontWeight="bold"
          >
            {year}
          </text>
        </g>
      );
    }

    // 通常の日付表示
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={textMutedColor}
          fontSize={10}
        >
          {payload.value}
        </text>
      </g>
    );
  };

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
          <Icon className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {CHART_LABELS[chartType]}
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

      <div ref={containerRef} className="relative w-full">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          onScroll={handleScroll}
          style={{
    minHeight: "280px",
    width: "100%",
    maxWidth: "100%",
    WebkitOverflowScrolling: "touch",
          }}
        >
          <LineChart
            width={chartWidth}
            height={280}
            data={chartData}
            margin={{ top: 8, right: 20, left: 20, bottom: 10 }}
            {...chartEventHandlers}
          >
            <defs>
              <filter
                id="shadowProfile"
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
              tick={xAxisDomain ? { fill: textMutedColor, fontSize: 10 } : CustomTick}
              tickLine={false}
              axisLine={{ stroke: gridColor, strokeWidth: 1 }}
              domain={xAxisDomain}
              ticks={xAxisDomain || visibleXAxisTicks}
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
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 7 : 5}
                    style={{
                      fill: isSelected ? primaryColor : bgColor,
                      stroke: primaryColor,
                      transition: "r 0.3s ease, fill 0.3s ease",
                    }}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isSelected ? "url(#shadowProfile)" : undefined}
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
        </div>

        {selectedIndex !== null &&
          selectedIndex < dataPointCoordinates.length &&
          dataPointCoordinates[selectedIndex] &&
          selectedData && (
            <SelectionLabel
              x={dataPointCoordinates[selectedIndex].cx}
              date={selectedData.fullDate}
              value={selectedData.value}
              unit={CHART_UNITS[chartType]}
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
            {latestData.value.toFixed(1)}
            {CHART_UNITS[chartType]}
          </span>
          <span className="text-xs" style={{ color: textMutedColor }}>
            {format(new Date(latestData.fullDate), "M月d日")}
          </span>
        </div>
      </div>
    </div>
  );
}
