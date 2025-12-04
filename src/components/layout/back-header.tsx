"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BackHeaderProps {
  title: string;
  onBack?: () => void;
  className?: string;
}

export function BackHeader({ title, onBack, className }: BackHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 h-14 flex items-center justify-between",
        className
      )}
    >
      <Button
        variant="ghost"
        className="h-auto p-0 text-muted-foreground hover:text-foreground hover:bg-transparent gap-1 active:opacity-50 transition-all cursor-pointer"
        onClick={handleBack}
      >
        <ChevronRight className="w-5 h-5 rotate-180" />
        <span className="text-sm font-bold">戻る</span>
      </Button>
      <span className="text-sm font-bold">{title}</span>
      <div className="w-10" />
    </div>
  );
}
