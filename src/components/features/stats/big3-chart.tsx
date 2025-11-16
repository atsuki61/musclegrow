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
import type { Big3ProgressData } from "@/types/stats";
import { format } from "date-fns";
import { BODY_PART_COLOR_HEX } from "@/lib/utils";
import { COLORS } from "./profile-chart.constants";
import {
  VerticalReferenceLineComponent,
  SelectionLabel,
} from "./shared-chart-components";
import { useDataPointCoordinates } from "./profile-chart.hooks";
import { TrendingUp } from "lucide-react";

interface Big3ChartProps {
  data: Big3ProgressData;
  dataCount?: number;
}

// Big3の色定義
const BIG3_COLORS = {
  benchPress: BODY_PART_COLOR_HEX.chest, // 赤
  squat: BODY_PART_COLOR_HEX.legs, // 緑
  deadlift: BODY_PART_COLOR_HEX.back, // 青
} as const;

/**
 * Big3グラフコンポーネント（プロフィールと同じデザイン）
 */
export function Big3Chart({ data, dataCount }: Big3ChartProps) {
  // 選択されたデータポイントのインデックスと種目
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<
    "benchPress" | "squat" | "deadlift" | null
  >(null);
  // グラフコンテナのref（ラベル位置制限用）
  const containerRef = useRef<HTMLDivElement>(null);
  // 各線のデータポイントインデックスを管理するref
  const benchPressIndexRef = useRef(0);
  const squatIndexRef = useRef(0);
  const deadliftIndexRef = useRef(0);

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
      date: format(new Date(date), "M/d"),
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

  // データポイントの座標を収集（各線ごと）
  const [benchPressCoordinates, collectBenchPressCoordinate] =
    useDataPointCoordinates(
      chartData.filter((d) => d.benchPress !== null).length
    );
  const [squatCoordinates, collectSquatCoordinate] = useDataPointCoordinates(
    chartData.filter((d) => d.squat !== null).length
  );
  const [deadliftCoordinates, collectDeadliftCoordinate] =
    useDataPointCoordinates(
      chartData.filter((d) => d.deadlift !== null).length
    );

  // 選択されたデータポイントの座標を取得
  const getSelectedCoordinates = () => {
    if (selectedIndex === null || selectedExercise === null) return null;

    const filteredData = chartData.filter((d) => d[selectedExercise] !== null);
    if (selectedIndex >= filteredData.length) return null;

    switch (selectedExercise) {
      case "benchPress":
        return benchPressCoordinates[selectedIndex];
      case "squat":
        return squatCoordinates[selectedIndex];
      case "deadlift":
        return deadliftCoordinates[selectedIndex];
      default:
        return null;
    }
  };

  const selectedCoordinates = getSelectedCoordinates();

  // 選択されたデータを取得
  const getSelectedData = () => {
    if (selectedIndex === null || selectedExercise === null) return null;

    const filteredData = chartData.filter((d) => d[selectedExercise] !== null);
    if (selectedIndex >= filteredData.length) return null;

    const dataPoint = filteredData[selectedIndex];
    const value = dataPoint[selectedExercise];
    if (value === null) return null;

    return {
      date: dataPoint.fullDate,
      value,
      exercise: selectedExercise,
    };
  };

  const selectedData = getSelectedData();

  // マウス位置から最も近いデータポイントを探す共通関数
  const findClosestPoint = (x: number) => {
    let closestIndex: number | null = null;
    let closestExercise: "benchPress" | "squat" | "deadlift" | null = null;
    let minDistance = Infinity;

    // 各線の座標を配列にまとめて処理
    const coordinateSets: Array<{
      coordinates: Array<{ cx: number; cy: number; value: number }>;
      exercise: "benchPress" | "squat" | "deadlift";
    }> = [
      { coordinates: benchPressCoordinates, exercise: "benchPress" },
      { coordinates: squatCoordinates, exercise: "squat" },
      { coordinates: deadliftCoordinates, exercise: "deadlift" },
    ];

    // 全ての線を1つのループで処理
    coordinateSets.forEach(({ coordinates, exercise }) => {
      coordinates.forEach((coord, idx) => {
        const distance = Math.abs(coord.cx - x);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = idx;
          closestExercise = exercise;
        }
      });
    });

    if (closestIndex !== null && closestExercise !== null && minDistance < 50) {
      return { index: closestIndex, exercise: closestExercise };
    }
    return null;
  };

  // 最新データを取得
  const latestData = {
    benchPress:
      data.benchPress.length > 0
        ? data.benchPress[data.benchPress.length - 1]
        : null,
    squat: data.squat.length > 0 ? data.squat[data.squat.length - 1] : null,
    deadlift:
      data.deadlift.length > 0 ? data.deadlift[data.deadlift.length - 1] : null,
  };

  // Y軸のドメインを計算
  const allValues: number[] = [];
  chartData.forEach((d) => {
    if (d.benchPress !== null) allValues.push(d.benchPress);
    if (d.squat !== null) allValues.push(d.squat);
    if (d.deadlift !== null) allValues.push(d.deadlift);
  });
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const yAxisDomain: [number, number] = [
    Math.max(0, minValue - 10),
    maxValue + 10,
  ];

  // レンダリング前にインデックスをリセット
  benchPressIndexRef.current = 0;
  squatIndexRef.current = 0;
  deadliftIndexRef.current = 0;

  if (!hasData) {
    return (
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
            Big3 推移
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
            Big3 推移
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
              if (data?.activeCoordinate) {
                const x = data.activeCoordinate.x;
                const closest = findClosestPoint(x);
                if (closest) {
                  setSelectedIndex(closest.index);
                  setSelectedExercise(closest.exercise);
                }
              }
            }}
            onMouseLeave={() => {
              setSelectedIndex(null);
              setSelectedExercise(null);
            }}
            onClick={(data) => {
              if (data?.activeCoordinate) {
                const x = data.activeCoordinate.x;
                const closest = findClosestPoint(x);
                if (closest) {
                  setSelectedIndex(closest.index);
                  setSelectedExercise(closest.exercise);
                }
              }
            }}
          >
            <defs>
              <filter
                id="shadowBench"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="4"
                  floodColor={BIG3_COLORS.benchPress}
                  floodOpacity="0.25"
                />
              </filter>
              <filter
                id="shadowSquat"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="4"
                  floodColor={BIG3_COLORS.squat}
                  floodOpacity="0.25"
                />
              </filter>
              <filter
                id="shadowDeadlift"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="4"
                  floodColor={BIG3_COLORS.deadlift}
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

            {/* ベンチプレス線 */}
            {data.benchPress.length > 0 && (
              <>
                {chartData.filter((d) => d.benchPress !== null).length > 1 && (
                  <Line
                    type="monotone"
                    dataKey="benchPress"
                    stroke={BIG3_COLORS.benchPress}
                    strokeWidth={3}
                    dot={false}
                    activeDot={false}
                    connectNulls={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="benchPress"
                  stroke="transparent"
                  strokeWidth={0}
                  dot={(props) => {
                    const currentIndex = benchPressIndexRef.current++;
                    const isSelected =
                      selectedIndex === currentIndex &&
                      selectedExercise === "benchPress";
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={isSelected ? 7 : 5}
                        fill={
                          isSelected ? BIG3_COLORS.benchPress : COLORS.white
                        }
                        stroke={BIG3_COLORS.benchPress}
                        strokeWidth={isSelected ? 3 : 2}
                        filter={isSelected ? "url(#shadowBench)" : undefined}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(currentIndex);
                          setSelectedExercise("benchPress");
                        }}
                      />
                    );
                  }}
                  label={(props: {
                    x?: unknown;
                    y?: unknown;
                    value?: unknown;
                    index?: number;
                    benchPress?: number | null;
                  }) => {
                    if (
                      props.benchPress !== null &&
                      props.benchPress !== undefined
                    ) {
                      collectBenchPressCoordinate(props);
                    }
                    return null;
                  }}
                />
              </>
            )}

            {/* スクワット線 */}
            {data.squat.length > 0 && (
              <>
                {chartData.filter((d) => d.squat !== null).length > 1 && (
                  <Line
                    type="monotone"
                    dataKey="squat"
                    stroke={BIG3_COLORS.squat}
                    strokeWidth={3}
                    dot={false}
                    activeDot={false}
                    connectNulls={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="squat"
                  stroke="transparent"
                  strokeWidth={0}
                  dot={(props) => {
                    const currentIndex = squatIndexRef.current++;
                    const isSelected =
                      selectedIndex === currentIndex &&
                      selectedExercise === "squat";
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={isSelected ? 7 : 5}
                        fill={isSelected ? BIG3_COLORS.squat : COLORS.white}
                        stroke={BIG3_COLORS.squat}
                        strokeWidth={isSelected ? 3 : 2}
                        filter={isSelected ? "url(#shadowSquat)" : undefined}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(currentIndex);
                          setSelectedExercise("squat");
                        }}
                      />
                    );
                  }}
                  label={(props: {
                    x?: unknown;
                    y?: unknown;
                    value?: unknown;
                    index?: number;
                    squat?: number | null;
                  }) => {
                    if (props.squat !== null && props.squat !== undefined) {
                      collectSquatCoordinate(props);
                    }
                    return null;
                  }}
                />
              </>
            )}

            {/* デッドリフト線 */}
            {data.deadlift.length > 0 && (
              <>
                {chartData.filter((d) => d.deadlift !== null).length > 1 && (
                  <Line
                    type="monotone"
                    dataKey="deadlift"
                    stroke={BIG3_COLORS.deadlift}
                    strokeWidth={3}
                    dot={false}
                    activeDot={false}
                    connectNulls={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="deadlift"
                  stroke="transparent"
                  strokeWidth={0}
                  dot={(props) => {
                    const currentIndex = deadliftIndexRef.current++;
                    const isSelected =
                      selectedIndex === currentIndex &&
                      selectedExercise === "deadlift";
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={isSelected ? 7 : 5}
                        fill={isSelected ? BIG3_COLORS.deadlift : COLORS.white}
                        stroke={BIG3_COLORS.deadlift}
                        strokeWidth={isSelected ? 3 : 2}
                        filter={isSelected ? "url(#shadowDeadlift)" : undefined}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(currentIndex);
                          setSelectedExercise("deadlift");
                        }}
                      />
                    );
                  }}
                  label={(props: {
                    x?: unknown;
                    y?: unknown;
                    value?: unknown;
                    index?: number;
                    deadlift?: number | null;
                  }) => {
                    if (
                      props.deadlift !== null &&
                      props.deadlift !== undefined
                    ) {
                      collectDeadliftCoordinate(props);
                    }
                    return null;
                  }}
                />
              </>
            )}

            {/* 選択されたデータポイントからX軸への垂直線 */}
            {selectedIndex !== null &&
              selectedExercise !== null &&
              selectedCoordinates && (
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
                      selectedIndex={0}
                      dataPointCoordinates={[selectedCoordinates]}
                      referenceLineColor={COLORS.referenceLine}
                    />
                  )}
                />
              )}
          </LineChart>
        </ResponsiveContainer>

        {/* 選択データ表示（グラフ上部、選択点のX座標に連動） */}
        {selectedData &&
          selectedCoordinates &&
          selectedCoordinates.cx !== undefined && (
            <SelectionLabel
              x={selectedCoordinates.cx}
              date={selectedData.date}
              value={selectedData.value}
              unit="kg"
              containerWidth={containerRef.current?.offsetWidth || 0}
              color={BIG3_COLORS[selectedData.exercise]}
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
          {latestData.benchPress && (
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: BIG3_COLORS.benchPress }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: BIG3_COLORS.benchPress }}
              >
                {latestData.benchPress.maxWeight.toFixed(1)}kg
              </span>
            </div>
          )}
          {latestData.squat && (
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: BIG3_COLORS.squat }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: BIG3_COLORS.squat }}
              >
                {latestData.squat.maxWeight.toFixed(1)}kg
              </span>
            </div>
          )}
          {latestData.deadlift && (
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: BIG3_COLORS.deadlift }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: BIG3_COLORS.deadlift }}
              >
                {latestData.deadlift.maxWeight.toFixed(1)}kg
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
