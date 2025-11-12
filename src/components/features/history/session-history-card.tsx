"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExerciseCard } from "./exercise-card";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";

interface SessionHistoryCardProps {
  /** セッション日付 */
  date: Date;
  /** トレーニング時間（分） */
  durationMinutes?: number | null;
  /** メモ */
  note?: string | null;
  /** 筋トレ種目の記録 */
  workoutExercises: Array<{
    exerciseId: string;
    sets: SetRecord[];
  }>;
  /** 有酸素種目の記録 */
  cardioExercises: Array<{
    exerciseId: string;
    records: CardioRecord[];
  }>;
  /** 種目一覧（IDから種目情報を取得するため） */
  exercises: Exercise[];
  /** 種目クリック時のコールバック */
  onExerciseClick?: (exercise: Exercise, date: Date) => void;
}

/**
 * セッション履歴カードコンポーネント
 * 日付、時間、メモ、種目記録を表示
 */
export function SessionHistoryCard({
  date,
  durationMinutes,
  note,
  workoutExercises,
  cardioExercises,
  exercises,
  onExerciseClick,
}: SessionHistoryCardProps) {
  const formattedDate = format(date, "yyyy年M月d日(E)", { locale: ja });

  // 種目IDから種目情報を取得
  const getExerciseById = (exerciseId: string): Exercise | undefined => {
    return exercises.find((e) => e.id === exerciseId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">📅 {formattedDate}</CardTitle>
          {durationMinutes && (
            <span className="text-sm text-muted-foreground">
              ⏱️ {durationMinutes}分
            </span>
          )}
        </div>
        {note && (
          <p className="text-sm text-muted-foreground mt-2">{note}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 筋トレ種目 */}
        {workoutExercises.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">💪 筋トレ種目</h3>
            <div className="space-y-3">
              {workoutExercises.map(({ exerciseId, sets }) => {
                const exercise = getExerciseById(exerciseId);
                if (!exercise) return null;

                return (
                  <ExerciseCard
                    key={exerciseId}
                    exercise={exercise}
                    sets={sets}
                    onClick={() => onExerciseClick?.(exercise, date)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 有酸素種目 */}
        {cardioExercises.length > 0 && (
          <div>
            {workoutExercises.length > 0 && <Separator className="my-4" />}
            <h3 className="text-sm font-semibold mb-2">🏃 有酸素種目</h3>
            <div className="space-y-3">
              {cardioExercises.map(({ exerciseId, records }) => {
                const exercise = getExerciseById(exerciseId);
                if (!exercise) return null;

                return (
                  <ExerciseCard
                    key={exerciseId}
                    exercise={exercise}
                    records={records}
                    onClick={() => onExerciseClick?.(exercise, date)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 記録がない場合 */}
        {workoutExercises.length === 0 && cardioExercises.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            記録がありません
          </p>
        )}
      </CardContent>
    </Card>
  );
}

