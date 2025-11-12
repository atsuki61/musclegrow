"use client";

import { Card } from "@/components/ui/card";
import { BODY_PART_LABELS } from "@/lib/utils";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";

interface ExerciseCardProps {
  /** 種目情報 */
  exercise: Exercise;
  /** セット記録（筋トレ種目の場合） */
  sets?: SetRecord[];
  /** 有酸素記録（有酸素種目の場合） */
  records?: CardioRecord[];
  /** クリック時のコールバック */
  onClick?: () => void;
}

/**
 * 種目カードコンポーネント
 * 種目名、部位、セット記録または有酸素記録を表示
 */
export function ExerciseCard({
  exercise,
  sets,
  records,
  onClick,
}: ExerciseCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="p-3">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-base">{exercise.name}</span>
          <span className="text-xs text-muted-foreground">
            {BODY_PART_LABELS[exercise.bodyPart]}
          </span>
        </div>

        {/* セット記録（筋トレ種目） */}
        {sets && sets.length > 0 && (
          <div className="space-y-1">
            {sets.map((set) => (
              <div
                key={set.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span>{set.setOrder}セット目:</span>
                {set.weight !== undefined && set.weight > 0 && (
                  <span className="font-medium">{set.weight}kg</span>
                )}
                <span>× {set.reps}回</span>
                {set.rpe && (
                  <span className="text-xs">(RPE: {set.rpe})</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 有酸素記録 */}
        {records && records.length > 0 && (
          <div className="space-y-1">
            {records.map((record) => (
              <div key={record.id} className="text-sm text-muted-foreground">
                <span>{record.duration}分</span>
                {record.distance && (
                  <span className="ml-2">{record.distance}km</span>
                )}
                {record.calories && (
                  <span className="ml-2 text-xs">{record.calories}kcal</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

