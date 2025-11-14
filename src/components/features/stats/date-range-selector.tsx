"use client";

import { HorizontalNav } from "./horizontal-nav";
import type { DateRangePreset } from "@/types/stats";

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "week", label: "週" },
  { value: "month", label: "月" },
  { value: "3months", label: "3ヶ月" },
  { value: "6months", label: "6ヶ月" },
  { value: "year", label: "1年" },
  { value: "all", label: "全期間" },
];

/**
 * 期間選択コンポーネント（横スクロール可能なナビゲーション）
 */
export function DateRangeSelector({
  value,
  onChange,
}: {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}) {
  return <HorizontalNav items={PRESETS} value={value} onChange={onChange} />;
}
