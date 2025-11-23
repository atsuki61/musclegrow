"use client";

import { memo } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Clock, FileText, Dumbbell, Activity } from "lucide-react";
import { SwipeableExerciseCard } from "./swipeable-exercise-card";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
import { getExerciseById } from "@/lib/local-storage-exercises";

interface SessionHistoryCardProps {
  date: Date;
  durationMinutes?: number | null;
  note?: string | null;
  workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
  cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
  exercises: Exercise[];
  onExerciseClick?: (exercise: Exercise, date: Date) => void;
  onExerciseDelete?: (exerciseId: string, date: Date) => void;
  maxWeights?: Record<string, number>;
}

const SessionHistoryCard = memo(function SessionHistoryCard({
  date,
  durationMinutes,
  note,
  workoutExercises,
  cardioExercises,
  exercises,
  onExerciseClick,
  onExerciseDelete,
  maxWeights = {},
}: SessionHistoryCardProps) {
  const router = useRouter();
  const formattedDate = format(date, "yyyy年M月d日 (E)", { locale: ja });
  const hasRecords = workoutExercises.length > 0 || cardioExercises.length > 0;

  const handleAddTraining = () => {
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/record?date=${dateStr}`);
  };

  // 記録がない場合のデザイン
  if (!hasRecords) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-muted/5 rounded-2xl border border-dashed border-border/60 animate-in fade-in zoom-in duration-300">
        <div className="w-14 h-14 bg-muted/20 rounded-full flex items-center justify-center mb-4">
          <Plus className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-bold mb-1">{formattedDate}</h3>
        <p className="text-sm text-muted-foreground mb-6">記録がありません</p>
        <Button
          onClick={handleAddTraining}
          className="rounded-full font-bold px-6 shadow-lg shadow-primary/20"
        >
          トレーニングを追加
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ヘッダーカード */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold tracking-tight">{formattedDate}</h2>
          <Button
            onClick={handleAddTraining}
            size="sm"
            variant="outline"
            className="h-9 rounded-full px-4 text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="w-3.5 h-3.5" /> 追加
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {durationMinutes && (
            <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-md">
              <Clock className="w-4 h-4" /> {durationMinutes}分
            </span>
          )}
        </div>

        {note && (
          <div className="mt-4 flex items-start gap-3 bg-muted/20 p-3 rounded-xl text-sm border border-border/30">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-foreground/80 leading-relaxed">{note}</p>
          </div>
        )}
      </div>

      {/* 筋トレ種目リスト */}
      {workoutExercises.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded text-orange-600">
              <Dumbbell className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Workouts
            </h3>
          </div>
          <div className="grid gap-3">
            {workoutExercises.map(({ exerciseId, sets }, index) => {
              const exercise = getExerciseById(exerciseId, exercises);
              if (!exercise) return null;
              return (
                <div
                  key={exerciseId}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                >
                  <SwipeableExerciseCard
                    exercise={exercise}
                    sets={sets}
                    onClick={() => onExerciseClick?.(exercise, date)}
                    onDelete={() => onExerciseDelete?.(exerciseId, date)}
                    maxWeights={maxWeights}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 有酸素種目リスト */}
      {cardioExercises.length > 0 && (
        <div className="space-y-3">
          {workoutExercises.length > 0 && (
            <Separator className="opacity-50 my-6" />
          )}
          <div className="flex items-center gap-2 px-1">
            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Cardio
            </h3>
          </div>
          <div className="grid gap-3">
            {cardioExercises.map(({ exerciseId, records }, index) => {
              const exercise = getExerciseById(exerciseId, exercises);
              if (!exercise) return null;
              return (
                <div
                  key={exerciseId}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                >
                  <SwipeableExerciseCard
                    exercise={exercise}
                    records={records}
                    onClick={() => onExerciseClick?.(exercise, date)}
                    onDelete={() => onExerciseDelete?.(exerciseId, date)}
                    maxWeights={maxWeights}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default SessionHistoryCard;
