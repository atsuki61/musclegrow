"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberStepper } from "./number-stepper";
import type { ProfileResponse } from "@/types/profile";

interface BodyCompositionEditorProps {
  initialData: ProfileResponse | null;
  onSave: (data: {
    height: number;
    weight: number;
    bodyFat: number;
    muscleMass: number;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function BodyCompositionEditor({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: BodyCompositionEditorProps) {
  const [height, setHeight] = useState(initialData?.height ?? 170);
  const [weight, setWeight] = useState(initialData?.weight ?? 60);
  const [bodyFat, setBodyFat] = useState(initialData?.bodyFat ?? 15);
  const [muscleMass, setMuscleMass] = useState(initialData?.muscleMass ?? 25);

  const handleSave = async () => {
    await onSave({
      height,
      weight,
      bodyFat,
      muscleMass,
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 pb-32">
      {/* ヘッダー */}
      <div className="px-4 py-3 flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          className="h-auto p-0 text-muted-foreground hover:text-foreground hover:bg-transparent gap-1 active:opacity-50 transition-all duration-200"
          onClick={onCancel}
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          <span className="text-sm font-medium">戻る</span>
        </Button>
        <h2 className="font-bold text-lg ml-2">体組成データを編集</h2>
      </div>

      <div className="px-4 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <NumberStepper
            label="身長"
            value={height}
            unit="cm"
            step={1}
            min={100}
            max={250}
            onChange={setHeight}
          />
          <NumberStepper
            label="体重"
            value={weight}
            unit="kg"
            step={0.1}
            min={30}
            max={200}
            onChange={setWeight}
          />
          <NumberStepper
            label="体脂肪率"
            value={bodyFat}
            unit="%"
            step={0.1}
            min={1}
            max={80}
            onChange={setBodyFat}
          />
          <NumberStepper
            label="筋肉量"
            value={muscleMass}
            unit="kg"
            step={0.1}
            min={10}
            max={100}
            onChange={setMuscleMass}
          />
        </div>

        {/* 保存ボタン */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          // 修正点: active:scale-95 を適用し、押した感を強調
          className="w-full py-6 text-base font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
          size="lg"
        >
          {isSaving ? "保存中..." : "保存して戻る"}
        </Button>
      </div>
    </div>
  );
}
