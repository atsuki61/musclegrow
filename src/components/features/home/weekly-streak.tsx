"use client";

import { Flame } from "lucide-react";

export function WeeklyStreak() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const completed = [1, 3, 5]; // 仮データ
  const today = new Date().getDay(); // 0(日)〜6(土)

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-bold text-xs tracking-wider text-muted-foreground flex items-center gap-1.5 uppercase">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          Weekly Streak
        </h2>
      </div>
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex justify-between items-center">
        {days.map((day, i) => {
          const done = completed.includes(i);
          const isToday = i === today;
          return (
            <div key={day} className="flex flex-col items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase ${
                  isToday ? "text-primary" : "text-muted-foreground/60"
                }`}
              >
                {day.charAt(0)}
              </span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done
                    ? "bg-linear-to-br from-primary to-orange-600 text-white shadow-lg shadow-primary/25 scale-110"
                    : "bg-muted/50 text-muted-foreground/20"
                } ${
                  isToday && !done
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : ""
                }`}
              >
                {done ? "✓" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
