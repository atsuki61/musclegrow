"use client";

import { HorizontalNav } from "./horizontal-nav";
import type { BodyPart } from "@/types/workout";
import { BODY_PART_LABELS } from "@/lib/utils";

const BODY_PARTS: BodyPart[] = [
  "all",
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "other",
  "big3",
];

const BODY_PART_ITEMS = BODY_PARTS.map((bodyPart) => ({
  value: bodyPart,
  label: BODY_PART_LABELS[bodyPart],
}));

/**
 * 部位選択コンポーネント（横スクロール可能なナビゲーション）
 */
export function BodyPartSelector({
  value,
  onChange,
}: {
  value: BodyPart;
  onChange: (bodyPart: BodyPart) => void;
}) {
  return (
    <HorizontalNav items={BODY_PART_ITEMS} value={value} onChange={onChange} />
  );
}
