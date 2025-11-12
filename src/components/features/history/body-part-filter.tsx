"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BODY_PART_LABELS, BODY_PART_COLORS, cn } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";

const BODY_PARTS: BodyPart[] = [
  "all",
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "other",
];

interface BodyPartFilterProps {
  /** 選択された部位 */
  selectedPart: BodyPart;
  /** 部位変更時のコールバック */
  onPartChange: (part: BodyPart) => void;
}

/**
 * 部位別フィルターコンポーネント
 * カレンダー上部に表示され、部位別の色分けタブを提供
 */
export function BodyPartFilter({
  selectedPart = "all",
  onPartChange,
}: BodyPartFilterProps) {
  const handlePartChange = (part: BodyPart) => {
    onPartChange(part);
  };

  return (
    <Tabs
      value={selectedPart}
      onValueChange={(value) => handlePartChange(value as BodyPart)}
      className="mb-4"
    >
      <TabsList className="h-12 w-full justify-start overflow-x-auto">
        {BODY_PARTS.map((part) => {
          const isSelected = selectedPart === part;
          const colorClass = BODY_PART_COLORS[part];

          return (
            <TabsTrigger
              key={part}
              value={part}
              className={cn(
                "whitespace-nowrap transition-all",
                // 選択時: 濃い色の背景、白文字
                isSelected && colorClass,
                isSelected && "text-white",
                // 未選択時: 薄い色の背景、通常文字
                !isSelected && `${colorClass}/20`,
                !isSelected && "hover:bg-opacity-30"
              )}
            >
              {BODY_PART_LABELS[part]}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
