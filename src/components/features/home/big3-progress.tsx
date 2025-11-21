"use client";

import Link from "next/link";
import { Trophy, Target } from "lucide-react";
import { useEffect, useState } from "react";

type Big3Exercise = {
  name: string;
  current: number;
  target: number;
  color: string;
};

interface Big3ProgressProps {
  benchPress: Big3Exercise;
  squat: Big3Exercise;
  deadlift: Big3Exercise;
}

// 数値を0からカウントアップさせるヘルパー
function CountUp({ to, duration = 1500 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);

      setCount(Math.floor(to * easeOut));

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [to, duration]);

  return <>{count}</>;
}

export function Big3Progress({
  benchPress,
  squat,
  deadlift,
}: Big3ProgressProps) {
  const exercises = [benchPress, squat, deadlift];

  const totalCurrent = exercises.reduce((sum, ex) => sum + ex.current, 0);
  const totalTarget = exercises.reduce((sum, ex) => sum + ex.target, 0) || 1;
  const totalProgress = Math.round((totalCurrent / totalTarget) * 100);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-primary/10 rounded-md">
            <Trophy className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-none">BIG 3 TOTAL</h2>
            <span className="text-[10px] text-muted-foreground">
              Powerlifting Score
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-0.5">
            <span className="text-2xl font-black text-foreground tracking-tight">
              <CountUp to={totalCurrent} />
            </span>
            <span className="text-xs text-muted-foreground font-bold">kg</span>
          </div>
          {/* 合計の％表示は「達成率」として意味があるので残していますが、
              不要であればここも削除可能です */}
          <div className="text-[9px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full inline-block">
            Overall <CountUp to={totalProgress} />%
          </div>
        </div>
      </div>

      {/* カード本体 */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none space-y-4 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />

        <div className="space-y-3">
          {exercises.map((exercise) => {
            const progress = Math.min(
              (exercise.current / exercise.target) * 100,
              100
            );

            return (
              <div key={exercise.name} className="relative group">
                {/* 変更点: 1行にまとめ、右側に数値(90/100kg)を配置 */}
                <div className="flex justify-between items-center mb-1.5">
                  {/* 左側: 種目名のみ */}
                  <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                    {exercise.name}
                  </span>

                  {/* 右側: ％表示があった場所に数値を配置 */}
                  <div className="flex items-baseline gap-0.5 text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                    <span className="text-sm font-bold tabular-nums leading-none">
                      <CountUp to={exercise.current} />
                    </span>
                    <span className="text-[10px] text-primary/60 font-medium">
                      /{exercise.target}kg
                    </span>
                  </div>
                </div>

                {/* プログレスバー */}
                <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full relative transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-primary to-orange-600"
                    style={{ width: mounted ? `${progress}%` : "0%" }}
                  >
                    <div className="absolute inset-0 w-full h-full -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/60 blur-[0.5px] shadow-[0_0_4px_rgba(255,255,255,0.8)] z-20" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 編集リンク */}
        <div className="pt-1 flex justify-center">
          <Link
            href="/goals"
            className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 py-1.5 px-3 hover:bg-muted rounded-full"
          >
            <Target className="w-3 h-3" />
            目標値を調整
          </Link>
        </div>
      </div>
    </section>
  );
}
