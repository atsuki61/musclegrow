"use client";

import { useState, useMemo } from "react";
import { ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NumberStepper } from "./number-stepper";
import type { ProfileResponse } from "@/types/profile";
import { getBMIResult, getBMIPercentage } from "@/lib/utils/bmi";
import {
  calculateBodyComposition,
  isBodyCompositionValid,
} from "@/lib/utils/body-composition";

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
  // ステート管理
  const [height, setHeight] = useState(initialData?.height ?? 170);
  const [weight, setWeight] = useState(initialData?.weight ?? 60);
  const [bodyFat, setBodyFat] = useState(initialData?.bodyFat ?? 15);
  const [muscleMass, setMuscleMass] = useState(initialData?.muscleMass ?? 25);

  // --- リアルタイム計算ロジック ---
  const bmiData = useMemo(() => {
    if (height > 0 && weight > 0) {
      const result = getBMIResult(height, weight);
      const percentage = getBMIPercentage(result.bmi);
      return { ...result, percentage };
    }
    return null;
  }, [height, weight]);

  const composition = useMemo(() => {
    if (isBodyCompositionValid(weight, bodyFat, muscleMass)) {
      return calculateBodyComposition(weight, bodyFat, muscleMass);
    }
    return null;
  }, [weight, bodyFat, muscleMass]);

  const handleSave = async () => {
    await onSave({ height, weight, bodyFat, muscleMass });
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 pb-32 bg-gray-50/50 dark:bg-background min-h-screen">
      {/* 1. ヘッダー */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 h-14 flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          className="h-auto p-0 text-muted-foreground hover:text-foreground hover:bg-transparent gap-1 active:opacity-50 transition-all"
          onClick={onCancel}
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          <span className="text-sm font-bold">戻る</span>
        </Button>
        <span className="text-sm font-bold">体組成データの編集</span>
        <div className="w-10" />
      </div>

      <div className="px-4 space-y-5">
        {/* 2. BMI ビジュアルカード (適正体重削除版) */}
        {bmiData && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-500/20">
            {/* 背景装飾 */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 mb-1">
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">
                BMI Score
              </p>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black tracking-tighter leading-none">
                  {bmiData.bmi}
                </span>
                <span className="text-sm font-medium opacity-90 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  {bmiData.categoryLabel}
                </span>
              </div>
            </div>

            {/* BMI プログレスバー */}
            <div className="mt-4 relative h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-700 ease-out rounded-full overflow-hidden"
                style={{ width: `${bmiData.percentage}%` }}
              >
                {/* シマー効果（光沢アニメーション） */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 animate-shimmer opacity-70" />
              </div>
            </div>

            {/* 目盛り数値 */}
            <div className="flex justify-between text-[9px] font-medium opacity-60 mt-1 font-mono">
              <span>18.5</span>
              <span>22.0</span>
              <span>25.0</span>
            </div>
          </div>
        )}
        {/* 3. 体組成チャート */}
        {composition && (
          <Card className="p-4 border-border/60 shadow-sm rounded-xl space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase">
                構成比率
              </span>
            </div>

            {/* 共通のバー描画ロジックとして適用 */}

            {/* 筋肉 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  筋肉量
                </span>
                <span className="font-bold tabular-nums">
                  {composition.muscleMass}kg{" "}
                  <span className="text-muted-foreground text-[10px]">
                    ({composition.muscleMassPercentage}%)
                  </span>
                </span>
              </div>
              <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${composition.muscleMassPercentage}%` }}
                >
                  {/* 光沢アニメーションの追加 */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
                </div>
              </div>
            </div>

            {/* 脂肪 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  体脂肪
                </span>
                <span className="font-bold tabular-nums">
                  {composition.fatMass}kg{" "}
                  <span className="text-muted-foreground text-[10px]">
                    ({composition.fatMassPercentage}%)
                  </span>
                </span>
              </div>
              <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${composition.fatMassPercentage}%` }}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
                </div>
              </div>
            </div>

            {/* 推定骨量・その他 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  推定骨量・その他
                </span>
                <span className="font-bold tabular-nums">
                  {composition.otherMass}kg{" "}
                  <span className="text-muted-foreground text-[10px]">
                    ({composition.otherMassPercentage}%)
                  </span>
                </span>
              </div>
              <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${composition.otherMassPercentage}%` }}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 4. 入力フォームエリア */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
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
        </div>

        {/* 5. 保存ボタン */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-6 text-base font-bold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          size="lg"
        >
          {isSaving ? "保存中..." : "保存して戻る"}
        </Button>
      </div>
    </div>
  );
}
