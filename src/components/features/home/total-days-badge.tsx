"use client";

import { Flame } from "lucide-react";

interface TotalDaysBadgeProps {
  days: number;
}

export function TotalDaysBadge({ days }: TotalDaysBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 bg-card/50 border border-border/50 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
      <div className="relative">
        {/* 炎の光彩エフェクト */}
        <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
        <Flame className="w-4 h-4 text-primary fill-primary relative z-10" />
      </div>
      <span className="text-sm font-bold tabular-nums leading-none">
        {days}
      </span>
    </div>
  );
}
