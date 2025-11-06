"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BODY_PART_LABELS } from "@/lib/utils";
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

interface BodyPartNavigationProps {
  /** 選択された部位 */
  selectedPart?: BodyPart;
  /** 部位変更時のコールバック */
  onPartChange?: (part: BodyPart) => void;
}

/**
 * 部位ナビゲーションコンポーネント
 * ページ上部に固定表示され、部位タブをクリックで該当部位のカードにスクロール
 */
export function BodyPartNavigation({
  selectedPart = "all",
  onPartChange,
}: BodyPartNavigationProps) {
  const [activePart, setActivePart] = useState<BodyPart>(selectedPart);

  // selectedPartが変更された時にactivePartを更新
  useEffect(() => {
    setActivePart(selectedPart);
  }, [selectedPart]);

  const handlePartChange = (part: BodyPart) => {
    setActivePart(part);
    onPartChange?.(part);
    // TODO: 該当部位のカードにスクロール（後で実装）
  };

  return (
    <Tabs
      value={activePart}
      onValueChange={(value) => handlePartChange(value as BodyPart)}
    >
      <TabsList className="h-12 w-full justify-start overflow-x-auto">
        {BODY_PARTS.map((part) => (
          <TabsTrigger key={part} value={part} className="whitespace-nowrap">
            {BODY_PART_LABELS[part]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
