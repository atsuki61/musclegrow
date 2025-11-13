"use client";

import { Card } from "@/components/ui/card";
import { ChevronsLeft } from "lucide-react";
import { BODY_PART_LABELS, calculate1RM } from "@/lib/utils";
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
  /** 種目ごとの最大重量（過去の記録を含む） */
  maxWeights?: Record<string, number>;
  /** スワイプヒントを表示するかどうか（履歴画面用） */
  showSwipeHint?: boolean;
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
  maxWeights = {},
  showSwipeHint = false,
}: ExerciseCardProps) {
  // MAX重量を取得（過去の記録を含む全記録の中で最大の重量）
  const maxWeight = maxWeights[exercise.id] || 0;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50 py-2 px-1"
      onClick={onClick}
    >
      <div className="p-1.5">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold text-sm leading-tight">
            {exercise.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">
              {BODY_PART_LABELS[exercise.bodyPart]}
            </span>
            {/* スワイプヒント（履歴画面でのみ表示） */}
            {showSwipeHint && (
              <ChevronsLeft className="h-3.5 w-3.5 text-muted-foreground/30 animate-pulse" />
            )}
          </div>
        </div>

        {/* セット記録（筋トレ種目） */}
        {sets && sets.length > 0 && (
          <div className="space-y-0.5">
            {sets.map((set) => {
              const weight = set.weight ?? 0;
              const isMaxWeight = weight > 0 && weight === maxWeight;
              const oneRM =
                weight > 0 && set.reps > 0
                  ? calculate1RM(weight, set.reps)
                  : null;

              return (
                <div
                  key={set.id}
                  className="flex items-center justify-between text-xs text-muted-foreground leading-tight"
                >
                  {/* 左側：セット番号と重量×回数 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">
                      {set.setOrder}.
                    </span>
                    {weight > 0 ? (
                      <>
                        <div className="flex items-center">
                          <span className="tabular-nums w-14 text-right">
                            {weight.toFixed(1)}
                          </span>
                          <span className="ml-1">kg</span>
                        </div>
                        <span>×</span>
                        <span>{set.reps}回</span>
                      </>
                    ) : (
                      <span>{set.reps}回</span>
                    )}
                    {isMaxWeight && (
                      <span className="text-primary font-semibold ml-1">
                        MAX！
                      </span>
                    )}
                  </div>

                  {/* 右側：1RM */}
                  {oneRM && (
                    <div className="text-muted-foreground shrink-0 ml-2 flex items-center">
                      <span>1RM:</span>
                      <span className="tabular-nums w-14 text-right">
                        {oneRM.toFixed(1)}
                      </span>
                      <span className="ml-1">kg</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 有酸素記録 */}
        {records && records.length > 0 && (
          <div className="space-y-0.5">
            {records.map((record) => {
              const parts: string[] = [`${record.duration}分`];
              if (record.distance) {
                parts.push(`${record.distance}km`);
              }
              if (record.calories) {
                parts.push(`${record.calories}kcal`);
              }
              return (
                <div
                  key={record.id}
                  className="text-xs text-muted-foreground leading-tight"
                >
                  {parts.join(" / ")}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
