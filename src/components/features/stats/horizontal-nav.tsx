"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HorizontalNavProps<T extends string> {
  items: Array<{ value: T; label: string; className?: string }>;
  value: T;
  onChange: (value: T) => void;
}

/**
 * 横スクロール可能なナビゲーションコンポーネント（共通化）
 */
export function HorizontalNav<T extends string>({
  items,
  value,
  onChange,
}: HorizontalNavProps<T>) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex overflow-x-auto gap-2 py-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent -webkit-overflow-scrolling-touch">
        {items.map((item) => (
          <Button
            key={item.value}
            variant={value === item.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(item.value)}
            className={cn("shrink-0 whitespace-nowrap", item.className)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

