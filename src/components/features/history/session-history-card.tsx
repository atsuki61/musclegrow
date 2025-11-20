"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { SwipeableExerciseCard } from "./swipeable-exercise-card";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
import { getExerciseById } from "@/lib/local-storage-exercises";
import { memo } from "react";

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
  /** 種目削除時のコールバック */
  onExerciseDelete?: (exerciseId: string, date: Date) => void;
  /** 種目ごとの最大重量（過去の記録を含む） */
  maxWeights?: Record<string, number>;
}

/**
 * セッション履歴カードコンポーネント
 * 日付、時間、メモ、種目記録を表示
 */
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
  const formattedDate = format(date, "yyyy年M月d日(E)", { locale: ja });
  const hasRecords = workoutExercises.length > 0 || cardioExercises.length > 0;

  const handleAddTraining = () => {
    // 該当日付の記録ページへ遷移
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/record?date=${dateStr}`);
  };

  return (
    <Card className="py-5 gap-0">
      <CardHeader className="pb-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">📅 {formattedDate}</CardTitle>
          <div className="flex items-center gap-2">
            {durationMinutes && (
              <span className="text-sm text-muted-foreground">
                ⏱️ {durationMinutes}分
              </span>
            )}
            {hasRecords && (
              <Button
                onClick={handleAddTraining}
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-1.5 text-xs font-medium border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                追加
              </Button>
            )}
          </div>
        </div>
        {note && <p className="text-sm text-muted-foreground mt-1.5">{note}</p>}
      </CardHeader>
      <CardContent className="space-y-2 pt-0 px-4">
        {/* 筋トレ種目 */}
        {workoutExercises.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold mb-1 text-muted-foreground">
              💪 筋トレ種目
            </h3>
            <div className="space-y-1">
              {workoutExercises.map(({ exerciseId, sets }) => {
                const exercise = getExerciseById(exerciseId, exercises);
                if (!exercise) return null; // 種目が見つからない場合はスキップ

                return (
                  <SwipeableExerciseCard
                    key={exerciseId}
                    exercise={exercise}
                    sets={sets}
                    onClick={() => onExerciseClick?.(exercise, date)}
                    onDelete={() => onExerciseDelete?.(exerciseId, date)}
                    maxWeights={maxWeights}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 有酸素種目 */}
        {cardioExercises.length > 0 && (
          <div>
            {workoutExercises.length > 0 && <Separator className="my-2" />}
            <h3 className="text-xs font-semibold mb-1 text-muted-foreground">
              🏃 有酸素種目
            </h3>
            <div className="space-y-1">
              {cardioExercises.map(({ exerciseId, records }) => {
                const exercise = getExerciseById(exerciseId, exercises);
                if (!exercise) return null; // 種目が見つからない場合はスキップ

                return (
                  <SwipeableExerciseCard
                    key={exerciseId}
                    exercise={exercise}
                    records={records}
                    onClick={() => onExerciseClick?.(exercise, date)}
                    onDelete={() => onExerciseDelete?.(exerciseId, date)}
                    maxWeights={maxWeights}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 記録がない場合 */}
        {!hasRecords && (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-muted-foreground">
              この日の記録はまだありません
            </p>
            <Button onClick={handleAddTraining} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              トレーニングを追加
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default SessionHistoryCard;
