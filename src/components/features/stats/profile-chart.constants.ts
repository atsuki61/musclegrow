/**
 * プロフィールグラフ用の定数定義
 */

import { Weight, Activity, Heart, TrendingUp } from "lucide-react";
import type { ProfileChartType } from "@/types/stats";

export const CHART_LABELS: Record<ProfileChartType, string> = {
  weight: "体重の推移",
  bodyFat: "体脂肪率の推移",
  muscleMass: "筋肉量の推移",
  bmi: "BMIの推移",
};

export const CHART_UNITS: Record<ProfileChartType, string> = {
  weight: "kg",
  bodyFat: "%",
  muscleMass: "kg",
  bmi: "",
};

export const CHART_ICONS: Record<ProfileChartType, typeof Weight> = {
  weight: Weight,
  bodyFat: Activity,
  muscleMass: Heart,
  bmi: TrendingUp,
};

// オレンジを基調としたカラーパレット
export const COLORS = {
  primary: "#FF6B35", // メインオレンジ
  primaryLight: "#FF8C61", // 明るいオレンジ
  primaryPale: "#FFE5DC", // 薄いオレンジ
  text: "#1F2937", // ダークグレー
  textMuted: "#6B7280", // ミディアムグレー
  textLight: "#9CA3AF", // ライトグレー
  grid: "#E5E7EB", // グリッド
  white: "#FFFFFF",
  shadow: "rgba(255, 107, 53, 0.15)", // オレンジの影
  referenceLine: "#D3DCE5", // 選択線（薄いグレー）
} as const;

