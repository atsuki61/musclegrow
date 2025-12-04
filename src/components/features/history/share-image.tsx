"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Dumbbell, Flame, Activity, Trophy } from "lucide-react";
import { cn, calculate1RM } from "@/lib/utils";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
// 修正: local-storage-exercises ではなく utils からインポート
import { getExerciseById } from "@/lib/utils";

interface ShareImageProps {
  date: Date;
  workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
  cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
  exercises: Exercise[];
  themeColor: string;
  maxWeights: Record<string, number>;
  isDarkMode: boolean;
}

export const ShareImage = forwardRef<HTMLDivElement, ShareImageProps>(
  (
    {
      date,
      workoutExercises,
      cardioExercises,
      exercises,
      themeColor,
      maxWeights,
      isDarkMode,
    },
    ref
  ) => {
    // ... (以下、変更なし。元のファイルのままでOKです)
    const themeStyles: Record<string, string> = {
      orange: "from-orange-500 to-red-600",
      blue: "from-blue-500 to-indigo-600",
      red: "from-red-500 to-rose-600",
      green: "from-emerald-500 to-teal-600",
      purple: "from-purple-500 to-violet-600",
      yellow: "from-yellow-400 to-orange-500",
      monochrome: isDarkMode
        ? "from-slate-700 to-slate-900"
        : "from-slate-400 to-slate-600",
    };

    const gradientClass = themeStyles[themeColor] || themeStyles.orange;

    const bgClass = isDarkMode
      ? "bg-slate-950 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white"
      : "bg-white bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900";

    const cardBgClass = isDarkMode
      ? "bg-white/5 border-white/10"
      : "bg-white/60 border-slate-200 shadow-sm";

    const subTextClass = isDarkMode ? "text-white/40" : "text-slate-400";
    const valueTextClass = isDarkMode ? "text-white" : "text-slate-900";

    return (
      <div
        ref={ref}
        className={cn(
          "w-[375px] min-h-[600px] p-4 flex flex-col relative overflow-hidden font-sans",
          bgClass
        )}
      >
        {/* 背景装飾 */}
        <div
          className={cn(
            "absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r",
            gradientClass
          )}
        />
        <div
          className={cn(
            "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl bg-gradient-to-br",
            gradientClass,
            isDarkMode ? "opacity-10" : "opacity-5"
          )}
        />
        <div
          className={cn(
            "absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl bg-gradient-to-tr",
            gradientClass,
            isDarkMode ? "opacity-10" : "opacity-5"
          )}
        />

        {/* ヘッダー */}
        <div className="mb-3 relative z-10">
          <div
            className={cn(
              "flex items-center gap-1.5 mb-0.5",
              isDarkMode ? "opacity-70" : "opacity-60 text-slate-600"
            )}
          >
            <Dumbbell className="w-3 h-3" />
            <span className="text-[9px] font-bold tracking-widest uppercase">
              Workout Log
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight">
            {format(date, "yyyy年M月d日 (E)", { locale: ja })}
          </h1>
        </div>

        {/* トレーニングリスト */}
        <div className="flex-1 space-y-1.5 relative z-10">
          {workoutExercises.map(({ exerciseId, sets }) => {
            const exercise = getExerciseById(exerciseId, exercises);
            if (!exercise) return null;

            const dailyMaxWeight = Math.max(...sets.map((s) => s.weight || 0));
            const historicalMax = maxWeights[exerciseId] || 0;
            const isPR = dailyMaxWeight >= historicalMax && historicalMax > 0;

            const max1RM = Math.max(
              ...sets.map((s) =>
                s.weight && s.reps ? calculate1RM(s.weight, s.reps) || 0 : 0
              )
            );

            return (
              <div
                key={exerciseId}
                className={cn(
                  "rounded-lg p-2 border backdrop-blur-sm",
                  cardBgClass
                )}
              >
                <div className="flex flex-wrap justify-between items-center mb-1 gap-x-2">
                  <h3
                    className={cn(
                      "font-bold text-xs truncate mr-auto",
                      isDarkMode ? "text-white/95" : "text-slate-800"
                    )}
                  >
                    {exercise.name}
                  </h3>

                  <div className="flex items-center gap-2 text-[9px] font-mono leading-none">
                    {isPR && (
                      <span className="flex items-center gap-0.5 font-bold text-yellow-500 bg-yellow-500/10 px-1 py-0.5 rounded border border-yellow-500/20">
                        <Trophy className="w-2 h-2" /> PR
                      </span>
                    )}
                    {!isPR && historicalMax > 0 && (
                      <span className={subTextClass}>
                        MAX{" "}
                        <span
                          className={cn(
                            isDarkMode ? "text-white/60" : "text-slate-500"
                          )}
                        >
                          {historicalMax}
                        </span>
                      </span>
                    )}
                    {max1RM > 0 && (
                      <>
                        {!isPR && historicalMax > 0 && (
                          <span className="opacity-20">|</span>
                        )}
                        <span className={subTextClass}>
                          1RM{" "}
                          <span
                            className={cn(
                              isDarkMode ? "text-white/60" : "text-slate-500"
                            )}
                          >
                            {Math.round(max1RM)}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {sets.map((set, i) => {
                    const isMaxSet = set.weight === dailyMaxWeight;
                    const highlight = isPR && isMaxSet;

                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center rounded px-1.5 py-0.5 text-[9px] border",
                          highlight
                            ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400"
                            : isDarkMode
                            ? "bg-black/40 border-white/5"
                            : "bg-slate-100 border-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "mr-1 font-mono w-2 text-center",
                            highlight
                              ? "text-yellow-600/70 dark:text-yellow-400/70"
                              : isDarkMode
                              ? "text-white/30"
                              : "text-slate-400"
                          )}
                        >
                          {i + 1}
                        </span>
                        <div className="flex items-baseline gap-px">
                          <span
                            className={cn(
                              "font-bold",
                              highlight ? "" : valueTextClass
                            )}
                          >
                            {set.weight}
                          </span>
                          <span
                            className={cn(
                              "text-[7px]",
                              highlight
                                ? "text-yellow-600/70 dark:text-yellow-400/70"
                                : subTextClass
                            )}
                          >
                            kg
                          </span>
                        </div>
                        <span
                          className={cn(
                            "mx-0.5",
                            highlight ? "opacity-40" : "opacity-20"
                          )}
                        >
                          ×
                        </span>
                        <div className="flex items-baseline gap-px">
                          <span
                            className={cn(
                              "font-bold",
                              highlight ? "" : valueTextClass
                            )}
                          >
                            {set.reps}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {cardioExercises.map(({ exerciseId, records }) => {
            const exercise = getExerciseById(exerciseId, exercises);
            if (!exercise) return null;

            return (
              <div
                key={exerciseId}
                className={cn(
                  "rounded-lg p-2 border backdrop-blur-sm",
                  cardBgClass
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <h3
                    className={cn(
                      "font-bold text-xs truncate flex-1 mr-2",
                      isDarkMode ? "text-white/95" : "text-slate-800"
                    )}
                  >
                    {exercise.name}
                  </h3>
                  <Activity className={cn("w-3 h-3", subTextClass)} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {records.map((record, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center rounded px-1.5 py-0.5 text-[9px] border",
                        isDarkMode
                          ? "bg-black/40 border-white/5"
                          : "bg-slate-100 border-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "mr-1 font-mono w-2 text-center",
                          isDarkMode ? "text-white/30" : "text-slate-400"
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="flex items-baseline gap-px">
                        <span className={cn("font-bold", valueTextClass)}>
                          {record.duration}
                        </span>
                        <span className={cn("text-[7px]", subTextClass)}>
                          分
                        </span>
                      </div>
                      {record.distance && (
                        <>
                          <span className={cn("mx-0.5 opacity-20")}>/</span>
                          <div className="flex items-baseline gap-px">
                            <span className={cn("font-bold", valueTextClass)}>
                              {record.distance}
                            </span>
                            <span className={cn("text-[7px]", subTextClass)}>
                              km
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div
          className={cn(
            "mt-4 pt-2 border-t flex justify-between items-end relative z-10",
            isDarkMode ? "border-white/10" : "border-slate-200"
          )}
        >
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <div
                className={cn(
                  "w-4 h-4 rounded flex items-center justify-center bg-gradient-to-br",
                  gradientClass
                )}
              >
                <Dumbbell className="w-2.5 h-2.5 text-white" />
              </div>
              <span
                className={cn(
                  "font-black text-sm tracking-tighter",
                  isDarkMode ? "text-white" : "text-slate-900"
                )}
              >
                MuscleGrow
              </span>
            </div>
            <p
              className={cn(
                "text-[8px]",
                isDarkMode ? "text-white/30" : "text-slate-400"
              )}
            >
              昨日の自分を超えるための記録
            </p>
          </div>

          <div className="text-right">
            <div
              className={cn(
                "flex items-center gap-1 text-[9px] font-bold",
                isDarkMode ? "text-white/80" : "text-slate-600"
              )}
            >
              <Flame className="w-2.5 h-2.5" />
              <span>Good Workout!</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShareImage.displayName = "ShareImage";
