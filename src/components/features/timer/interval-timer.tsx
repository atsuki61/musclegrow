"use client";

import { useTimer } from "@/lib/timer-context";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Timer as TimerIcon, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function IntervalTimer() {
  const {
    timeLeft,
    duration,
    isActive,
    isMinimized,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    toggleMinimize,
  } = useTimer();

  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if ((timeLeft === 0 && !isActive) || isAuthPage || !mounted) return null;

  const progress = duration > 0 ? (timeLeft / duration) * 100 : 0;

  return createPortal(
    <AnimatePresence mode="wait">
      {isMinimized ? (
        <motion.div
          key="minimized"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          className="fixed bottom-24 right-4 z-[100]"
          // ▼ 追加: 識別用のデータ属性
          data-interval-timer="true"
        >
          <Button
            onClick={toggleMinimize}
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center relative overflow-hidden border-2 border-background"
          >
            <div
              className="absolute inset-0 bg-black/20 dark:bg-white/20 origin-bottom transition-all duration-1000 linear"
              style={{ height: `${progress}%` }}
            />
            <span className="relative z-10 text-xs font-bold font-mono">
              {formatTime(timeLeft)}
            </span>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-4 right-4 z-[100] mx-auto max-w-md pointer-events-auto"
          // ▼ 追加: 識別用のデータ属性
          data-interval-timer="true"
        >
          <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-1000 linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="flex items-center gap-2">
                <TimerIcon className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Interval
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-muted"
                  onClick={toggleMinimize}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive"
                  onClick={resetTimer}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-5xl font-black font-mono tabular-nums tracking-tight text-foreground">
                {formatTime(timeLeft)}
              </div>

              <Button
                variant={isActive ? "secondary" : "default"}
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full shadow-md transition-all active:scale-95",
                  isActive
                    ? "bg-muted text-foreground hover:bg-muted/80"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={isActive ? pauseTimer : resumeTimer}
              >
                {isActive ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </Button>
            </div>

            <div className="flex justify-center gap-2 mt-5 pt-4 border-t border-border/40">
              {[30, 60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  onClick={() => startTimer(sec)}
                  className="text-xs font-bold px-4 py-2 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
