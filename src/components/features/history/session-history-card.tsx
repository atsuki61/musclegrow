"use client";

import { memo } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/10 rounded-2xl border border-dashed border-muted-foreground/20 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{formattedDate}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          この日の記録はまだありません
        </p>
        <Button
          onClick={handleAddTraining}
          size="lg"
          className="rounded-xl shadow-lg shadow-primary/20"
        >
          トレーニングを開始する
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ヘッダー情報 */}
      <div className="flex flex-col gap-3 bg-card border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {formattedDate}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {durationMinutes && (
                <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md">
                  <Clock className="w-3.5 h-3.5" /> {durationMinutes}分
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={handleAddTraining}
            size="icon"
            className="h-10 w-10 rounded-full shadow-md active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {note && (
          <div className="flex items-start gap-2 bg-muted/30 p-3 rounded-xl text-sm">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-foreground/80 leading-relaxed">{note}</p>
          </div>
        )}
      </div>

      {/* 筋トレ種目リスト */}
      {workoutExercises.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Dumbbell className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
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
          {workoutExercises.length > 0 && <Separator className="opacity-50" />}
          <div className="flex items-center gap-2 px-1">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
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
