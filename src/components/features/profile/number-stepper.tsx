"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  label: string;
  value: number;
  unit: string;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
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
  const handleChange = (increment: boolean) => {
    const delta = increment ? step : -step;
    const nextValue = Math.round((value + delta) * 10) / 10;
    if (nextValue >= min && nextValue <= max) {
      onChange(nextValue);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleChange(false)}
          disabled={value <= min}
          // 修正点: active:scale-90 active:bg-accent を強調
          className="h-8 w-8 bg-background shadow-sm hover:bg-accent active:bg-accent active:scale-90 transition-all duration-150 shrink-0 rounded-lg cursor-pointer touch-manipulation"
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>

        <div className="flex-1 text-center">
          <span className="text-lg font-bold tabular-nums tracking-tight">
            {value}
          </span>
          <span className="text-xs text-muted-foreground ml-1 font-medium">
            {unit}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleChange(true)}
          disabled={value >= max}
          // 修正点: 同上
          className="h-8 w-8 bg-background shadow-sm hover:bg-accent active:bg-accent active:scale-90 transition-all duration-150 shrink-0 rounded-lg cursor-pointer touch-manipulation"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
