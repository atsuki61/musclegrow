"use client";

import { useState, useRef } from "react";
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
import { COLORS } from "./profile-chart.constants";
import {
  VerticalReferenceLineComponent,
  SelectionLabel,
  createChartEventHandlers,
} from "./shared-chart-components";
import { useDataPointCoordinates } from "./profile-chart.hooks";
import { calculateYAxisDomain } from "./profile-chart.utils";
import { TrendingUp } from "lucide-react";

interface ExerciseChartProps {
  data: ExerciseProgressData[];
  exercise: Exercise | null;
  dataCount?: number;
}

/**
 * 種目別グラフコンポーネント（プロフィールと同じデザイン）
 */
export function ExerciseChart({
  data,
  exercise,
  dataCount,
}: ExerciseChartProps) {
  // 選択されたデータポイントのインデックス
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // グラフコンテナのref（ラベル位置制限用）
  const containerRef = useRef<HTMLDivElement>(null);

  // グラフ用データを準備
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "M/d"),
    fullDate: item.date,
    value: item.maxWeight,
  }));

  // データポイントの座標を収集
  const [dataPointCoordinates, collectCoordinate] = useDataPointCoordinates(
    chartData.length
  );

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
            {exercise?.name || "種目別"} の推移
          </h3>
        </div>
        <div
          className="flex flex-col items-center justify-center h-[280px]"
          style={{ color: COLORS.textMuted }}
        >
          <p className="text-sm">データがありません</p>
          <p className="text-xs mt-1">最大重量が更新された日のみ表示されます</p>
        </div>
      </div>
    );
  }

  // 最新データを取得
  const latestData = chartData[chartData.length - 1];

  // 選択されたデータポイント（選択がない場合は最新）
  const selectedData =
    selectedIndex !== null && selectedIndex < chartData.length
      ? chartData[selectedIndex]
      : latestData;

  // グラフ設定を計算
  const yAxisDomain = calculateYAxisDomain(chartData);

  // 共通イベントハンドラを作成
  const chartEventHandlers = createChartEventHandlers(
    dataPointCoordinates,
    setSelectedIndex
  );

  return (
    <div
      className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
            {exercise?.name || "種目別"} の最大重量推移
          </h3>
        </div>
        {dataCount !== undefined && (
          <span
            className="text-xs font-medium"
            style={{ color: COLORS.textMuted }}
          >
            {dataCount}件
          </span>
        )}
      </div>

      {/* グラフ（相対位置でラップ） */}
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
                id="shadowOrange"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="4"
                  floodColor={COLORS.primary}
                  floodOpacity="0.25"
                />
              </filter>
            </defs>

            {/* グリッド（超薄く） */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.grid}
              opacity={0.1}
              vertical={false}
            />

            {/* X軸 */}
            <XAxis
              dataKey="date"
              stroke={COLORS.grid}
              tick={{ fill: COLORS.textLight, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: COLORS.grid, strokeWidth: 1 }}
            />

            {/* Y軸（最小限・薄く） */}
            <YAxis
              stroke={COLORS.grid}
              tick={{ fill: COLORS.textLight, fontSize: 11, opacity: 0.6 }}
              tickLine={false}
              axisLine={false}
              domain={yAxisDomain}
              tickCount={3}
              width={35}
            />

            {/* 折れ線（データが2点以上の場合のみ） */}
            {chartData.length > 1 && (
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={false}
                activeDot={false}
              />
            )}

            {/* データポイント（クリック可能、座標を取得するためlabelを使用） */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="transparent"
              strokeWidth={0}
              dot={(props) => {
                const isSelected = selectedIndex === props.index;
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={isSelected ? 7 : 5}
                    fill={isSelected ? COLORS.primary : COLORS.white}
                    stroke={COLORS.primary}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isSelected ? "url(#shadowOrange)" : undefined}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (props.index !== undefined) {
                        setSelectedIndex(props.index);
                      }
                    }}
                  />
                );
              }}
              activeDot={{
                r: 6,
                fill: COLORS.primary,
                stroke: COLORS.white,
                strokeWidth: 2,
              }}
              label={(props) => {
                collectCoordinate(props);
                return null;
              }}
            />

            {/* 選択されたデータポイントからX軸への垂直線（InBody風） */}
            {selectedIndex !== null &&
              selectedIndex < dataPointCoordinates.length &&
              dataPointCoordinates[selectedIndex] && (
                <Customized
                  component={(props: {
                    width?: number;
                    height?: number;
                    margin?: {
                      top: number;
                      right: number;
                      bottom: number;
                      left: number;
                    };
                  }) => (
                    <VerticalReferenceLineComponent
                      width={props.width}
                      height={props.height}
                      margin={props.margin}
                      selectedIndex={selectedIndex}
                      dataPointCoordinates={dataPointCoordinates}
                      referenceLineColor={COLORS.referenceLine}
                    />
                  )}
                />
              )}
          </LineChart>
        </ResponsiveContainer>

        {/* 選択データ表示（グラフ上部、選択点のX座標に連動） - InBody風 */}
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
              color={COLORS.primary}
            />
          )}
      </div>

      {/* フッター（最新データサマリー） */}
      <div
        className="mt-4 pt-4 border-t flex items-center justify-between"
        style={{ borderColor: COLORS.grid }}
      >
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          最新
        </span>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: COLORS.primary }}>
            {latestData.value.toFixed(1)}kg
          </span>
          <span className="text-xs" style={{ color: COLORS.textLight }}>
            {format(new Date(latestData.fullDate), "M月d日")}
          </span>
        </div>
      </div>
    </div>
  );
}
