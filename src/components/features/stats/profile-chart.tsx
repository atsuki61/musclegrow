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
import type { ProfileHistoryData, ProfileChartType } from "@/types/stats";
import { format } from "date-fns";
import {
  CHART_LABELS,
  CHART_UNITS,
  CHART_ICONS,
  COLORS,
} from "./profile-chart.constants";
import {
  transformChartData,
  calculateXAxisDomain,
  calculateYAxisDomain,
  findClosestDataPointIndex,
} from "./profile-chart.utils";
import { useDataPointCoordinates } from "./profile-chart.hooks";

interface ProfileChartProps {
  data: ProfileHistoryData[];
  chartType: ProfileChartType;
  dataCount?: number; // データ件数（オプション）
}

/**
 * 垂直線コンポーネント（Customized用）
 * RechartsのCustomizedコンポーネントから呼び出される
 */
function VerticalReferenceLineComponent(props: {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  selectedIndex?: number | null;
  dataPointCoordinates?: Array<{ cx: number; cy: number; value: number }>;
}) {
  // propsの検証
  if (!props.width || !props.height || !props.margin) {
    return null;
  }

  // 選択状態の検証
  if (
    props.selectedIndex === null ||
    props.selectedIndex === undefined ||
    !props.dataPointCoordinates ||
    props.selectedIndex >= props.dataPointCoordinates.length
  ) {
    return null;
  }

  const selectedPoint = props.dataPointCoordinates[props.selectedIndex];
  if (!selectedPoint || selectedPoint.cx === undefined) {
    return null;
  }

  // グラフの上端からX軸まで垂直線を描画
  const startY = props.margin.top;
  const endY = props.height - props.margin.bottom;

  return (
    <line
      x1={selectedPoint.cx}
      y1={startY}
      x2={selectedPoint.cx}
      y2={endY}
      stroke={COLORS.referenceLine}
      strokeWidth={1}
      strokeDasharray="5 5"
      opacity={0.6}
      style={{ pointerEvents: "none" }}
    />
  );
}

/**
 * 選択ラベルコンポーネント（InBody風 - 控えめで上品なデザイン）
 */
function SelectionLabel({
  x,
  date,
  value,
  unit,
  containerWidth,
}: {
  x: number;
  date: string;
  value: number;
  unit: string;
  containerWidth: number;
}) {
  // ラベルの幅を推定（日付 + 値 + パディング + ギャップ）
  // text-[10px] + text-[10px] + px-2 (8px*2) + gap-1 (4px) = 約80-90px
  const labelWidth = 90;
  const padding = 24; // カードの左右パディング（p-6 = 24px）

  // ラベルの位置をclamp（カード内に制限）
  const minX = padding + labelWidth / 2;
  const maxX =
    containerWidth > 0 ? containerWidth - padding - labelWidth / 2 : x; // containerWidthが0の場合は元の位置を使用

  const clampedX = Math.min(Math.max(x, minX), maxX);

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        top: "8px", // グラフの上端に配置
        left: `${clampedX}px`,
        transform: "translateX(-50%)",
      }}
    >
      {/* InBody風：小さく控えめで上品なラベル */}
      <div className="flex items-center gap-1 whitespace-nowrap bg-orange-50 px-2 py-[2px] rounded-md shadow-xs border border-gray-100/50">
        <span className="text-[10px] font-medium text-gray-500">
          {format(new Date(date), "yy.MM.dd")}
        </span>
        <span className="text-[10px] font-semibold text-orange-500">
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
    </div>
  );
}

/**
 * プロフィールグラフコンポーネント（モダン版）
 */
export function ProfileChart({
  data,
  chartType,
  dataCount,
}: ProfileChartProps) {
  // 選択されたデータポイントのインデックス
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // グラフコンテナのref（ラベル位置制限用）
  const containerRef = useRef<HTMLDivElement>(null);

  // グラフ用データを準備
  const chartData = transformChartData(data, chartType);

  // データポイントの座標を収集
  const [dataPointCoordinates, collectCoordinate] = useDataPointCoordinates(
    chartData.length
  );

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          {(() => {
            const Icon = CHART_ICONS[chartType];
            return (
              <Icon className="w-5 h-5" style={{ color: COLORS.primary }} />
            );
          })()}
          <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
            {CHART_LABELS[chartType]}
          </h3>
        </div>
        <div
          className="flex flex-col items-center justify-center h-[280px]"
          style={{ color: COLORS.textMuted }}
        >
          <p className="text-sm">データがありません</p>
          <p className="text-xs mt-1">プロフィール更新時に自動記録されます</p>
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
  const xAxisDomain = calculateXAxisDomain(chartData);
  const yAxisDomain = calculateYAxisDomain(chartData);

  // アイコンコンポーネント
  const Icon = CHART_ICONS[chartType];

  return (
    <div
      className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: COLORS.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
            {CHART_LABELS[chartType]}
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
            onMouseMove={(data) => {
              if (data?.activeCoordinate && dataPointCoordinates.length > 0) {
                const closestIndex = findClosestDataPointIndex(
                  data.activeCoordinate.x,
                  dataPointCoordinates
                );
                if (closestIndex !== null) {
                  setSelectedIndex(closestIndex);
                }
              }
            }}
            onMouseLeave={() => {
              setSelectedIndex(null);
            }}
            onClick={(data) => {
              if (data?.activeCoordinate && dataPointCoordinates.length > 0) {
                const closestIndex = findClosestDataPointIndex(
                  data.activeCoordinate.x,
                  dataPointCoordinates
                );
                setSelectedIndex(closestIndex);
              }
            }}
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
              domain={xAxisDomain}
              ticks={xAxisDomain}
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
              unit={CHART_UNITS[chartType]}
              containerWidth={containerRef.current?.offsetWidth || 0}
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
            {latestData.value.toFixed(1)}
            {CHART_UNITS[chartType]}
          </span>
          <span className="text-xs" style={{ color: COLORS.textLight }}>
            {format(new Date(latestData.fullDate), "M月d日")}
          </span>
        </div>
      </div>
    </div>
  );
}
