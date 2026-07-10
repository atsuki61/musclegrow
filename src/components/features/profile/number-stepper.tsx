"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NumberStepperProps {
  label: string; // ラベル
  value: number; // 現在の値
  unit: string; // 単位
  step?: number; // ステップ
  min?: number; // 最小値
  max?: number; // 最大値
  onChange: (value: number) => void; // 値が変更された時のコールバック
  className?: string; // クラス名
}

export function NumberStepper({
  label,
  value,
  unit,
  step = 0.1,
  min = 0,
  max = 300,
  onChange,
  className,
}: NumberStepperProps) {
  // 入力中の値を管理するローカルステート（"72." などの途中入力を許容するため）
  const [inputValue, setInputValue] = useState(() => value.toString()); // 入力値
  const [prevValue, setPrevValue] = useState(value); // 前の値
  const [isFocused, setIsFocused] = useState(false); // フォーカスされているかどうか

  // 親から渡された value が変わったらローカルステートも同期（入力中は除く）
  if (value !== prevValue) {
    setPrevValue(value);
    if (!isFocused) {
      // フォーカスされていない場合は、入力値を更新して親コンポーネントに通知
      setInputValue(value.toString());
    }
  }

  // ボタンがクリックされた時の処理
  const handleButtonChange = (increment: boolean) => {
    const delta = increment ? step : -step;
    const nextValue = Math.round((value + delta) * 10) / 10;
    if (nextValue >= min && nextValue <= max) {
      onChange(nextValue);
    }
  };

  // 入力フィールドの値が変更された時の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValueStr = e.target.value;
    setInputValue(newValueStr);

    // 入力値をパースして、数値に変換
    const newValue = parseFloat(newValueStr);
    if (!isNaN(newValue)) {
      // 入力中は範囲制限を緩くして、完了時(onBlur)に厳密にするのが一般的
      // ここでは即時反映させつつ、極端な値だけガード
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    let newValue = parseFloat(inputValue);
    if (isNaN(newValue)) {
      newValue = value; // 無効な値なら元に戻す
    } else {
      // 範囲内に収める
      if (newValue < min) newValue = min;
      if (newValue > max) newValue = max;
      // stepに合わせて丸める（必要なら）
      // newValue = Math.round(newValue / step) * step;
      // 小数点第1位まで
      newValue = Math.round(newValue * 10) / 10; // 小数点第1位まで
    }
    setInputValue(newValue.toString()); // 入力値を更新
    onChange(newValue); // 値が変更された時のコールバック
  };

  return (
    // 数値ステッパーを返す
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleButtonChange(false)}
          disabled={value <= min}
          className="h-8 w-8 bg-background shadow-sm hover:bg-accent active:bg-accent active:scale-90 transition-all duration-150 shrink-0 rounded-lg cursor-pointer touch-manipulation"
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>

        <div className="flex-1 flex items-baseline justify-center gap-1 relative">
          {/* 入力フィールド */}
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              handleBlur();
            }}
            step={step}
            min={min}
            max={max}
            className="w-20 text-center bg-transparent font-bold text-lg tabular-nums outline-none p-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-muted-foreground font-medium absolute right-2 pointer-events-none">
            {unit}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleButtonChange(true)}
          disabled={value >= max}
          className="h-8 w-8 bg-background shadow-sm hover:bg-accent active:bg-accent active:scale-90 transition-all duration-150 shrink-0 rounded-lg cursor-pointer touch-manipulation"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
