"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { ProfileHistoryData, ProfileChartType } from "@/types/stats";
import { format, subDays, addDays } from "date-fns";
import { TrendingUp, Weight, Activity, Heart } from "lucide-react";
import { toNumber } from "@/lib/utils/stats";

interface ProfileChartProps {
  data: ProfileHistoryData[];
  chartType: ProfileChartType;
}

const CHART_LABELS: Record<ProfileChartType, string> = {
  weight: "体重の推移",
  bodyFat: "体脂肪率の推移",
  muscleMass: "筋肉量の推移",
  bmi: "BMIの推移",
};

const CHART_UNITS: Record<ProfileChartType, string> = {
  weight: "kg",
  bodyFat: "%",
  muscleMass: "kg",
  bmi: "",
};

const CHART_ICONS: Record<ProfileChartType, typeof Weight> = {
  weight: Weight,
  bodyFat: Activity,
  muscleMass: Heart,
  bmi: TrendingUp,
};

// オレンジを基調としたカラーパレット
const COLORS = {
  primary: "#FF6B35", // メインオレンジ
  primaryLight: "#FF8C61", // 明るいオレンジ
  primaryPale: "#FFE5DC", // 薄いオレンジ
  text: "#1F2937", // ダークグレー
  textMuted: "#6B7280", // ミディアムグレー
  textLight: "#9CA3AF", // ライトグレー
  grid: "#E5E7EB", // グリッド
  white: "#FFFFFF",
  shadow: "rgba(255, 107, 53, 0.15)", // オレンジの影
};

// ラベルサイズと位置の定数
const LABEL_CONFIG = {
  // サイズ
  minWidth: 40, // 最小幅（px-2相当）
  height: 18, // 高さ（py-[3px]相当）
  horizontalPadding: 16, // 左右padding相当
  charWidth: 7, // 1文字あたりの概算幅（px）
  // 位置
  distanceFromDot: 12, // dotからの距離（px）
  visualCorrectionDown: 1, // 視覚補正（下にずらすpx）
  textVisualCorrection: 1, // テキスト位置の視覚補正（下にずらすpx）
  // スタイル
  fontSize: 12, // text-xs相当
  fontWeight: "600",
  borderRadius: 0.5, // rounded-full（高さの半分）
  shadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
};

/**
 * データポイント上のラベル（pill型・視覚補正版）
 */
const DataLabel = (props: {
  x?: string | number | null;
  y?: string | number | null;
  value?: string | number | null;
  index?: number;
  chartType: ProfileChartType;
}) => {
  const { x, y, value, chartType } = props;

  // 数値に変換
  const xPos = toNumber(x);
  const yPos = toNumber(y);
  const numValue = toNumber(value);

  // 型ガード：必要な値がすべて揃っているか確認
  if (xPos === null || yPos === null || numValue === null) return null;

  // すべてのデータポイントに吹き出しを表示
  const labelText = `${numValue.toFixed(1)}${CHART_UNITS[chartType]}`;

  // ラベルサイズを計算
  const textWidth = labelText.length * LABEL_CONFIG.charWidth;
  const labelWidth = Math.max(
    textWidth + LABEL_CONFIG.horizontalPadding,
    LABEL_CONFIG.minWidth
  );
  const labelHeight = LABEL_CONFIG.height;

  // ラベル位置を計算（dotから指定距離上、視覚補正で下にずらす）
  const labelTop =
    yPos - LABEL_CONFIG.distanceFromDot - LABEL_CONFIG.visualCorrectionDown;
  const labelCenterY = labelTop + labelHeight / 2;

  // テキスト位置を計算（視覚的に中央に見えるように微調整）
  const textY = labelCenterY + LABEL_CONFIG.textVisualCorrection;

  return (
    <g>
      {/* pill型ラベル背景（白背景 + オレンジボーダー） */}
      <rect
        x={xPos - labelWidth / 2}
        y={labelTop}
        width={labelWidth}
        height={labelHeight}
        fill={COLORS.white}
        stroke={COLORS.primary}
        strokeWidth={1}
        rx={labelHeight * LABEL_CONFIG.borderRadius}
        style={{ filter: `drop-shadow(${LABEL_CONFIG.shadow})` }}
      />
      {/* ラベルテキスト（オレンジ文字・視覚補正済み） */}
      <text
        x={xPos}
        y={textY}
        fill={COLORS.primary}
        fontSize={LABEL_CONFIG.fontSize}
        fontWeight={LABEL_CONFIG.fontWeight}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          lineHeight: 1, // leading-none相当
          letterSpacing: "0.01em",
        }}
      >
        {labelText}
      </text>
    </g>
  );
};

/**
 * プロフィールグラフコンポーネント（モダン版）
 */
export function ProfileChart({ data, chartType }: ProfileChartProps) {
  // グラフ用データを準備
  const chartData = data
    .map((item) => {
      const value =
        chartType === "weight"
          ? item.weight
          : chartType === "bodyFat"
          ? item.bodyFat
          : chartType === "muscleMass"
          ? item.muscleMass
          : item.bmi;

      if (value === null) return null;

      return {
        date: format(new Date(item.recordedAt), "M/d"),
        fullDate: item.recordedAt,
        value,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

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

  // タイムライン感を出すため、データが1点の場合はダミー日付を追加
  let xAxisDomain: string[] | undefined;
  if (chartData.length === 1) {
    const baseDate = new Date(chartData[0].fullDate);
    xAxisDomain = [
      format(subDays(baseDate, 2), "M/d"),
      format(subDays(baseDate, 1), "M/d"),
      format(baseDate, "M/d"),
      format(addDays(baseDate, 1), "M/d"),
      format(addDays(baseDate, 2), "M/d"),
    ];
  }

  // Y軸の範囲を計算（データの最小値-5 〜 最大値+5）
  const values = chartData.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yAxisDomain = [Math.max(0, minValue - 5), maxValue + 5];

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
      </div>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 20, left: 0, bottom: 10 }}
          style={{ cursor: "default" }}
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

          {/* データポイント */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="transparent"
            strokeWidth={0}
            dot={{
              r: 5,
              fill: COLORS.white,
              stroke: COLORS.primary,
              strokeWidth: 2,
              filter: "url(#shadowOrange)",
            }}
            activeDot={{
              r: 6,
              fill: COLORS.primary,
              stroke: COLORS.white,
              strokeWidth: 2,
            }}
            label={(props) => (
              <DataLabel
                x={props.x as string | number | null | undefined}
                y={props.y as string | number | null | undefined}
                value={props.value as string | number | null | undefined}
                chartType={chartType}
              />
            )}
          />
        </LineChart>
      </ResponsiveContainer>

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
