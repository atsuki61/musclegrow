"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { calculate1RM } from "@/lib/utils";
import type { SetRecord, CardioRecord } from "@/types/workout";

interface PreviousWorkoutRecordCardProps {
  /** 前回のセット記録 */
  sets: SetRecord[];
  /** 前回記録の日付 */
  date: Date;
  /** 前回記録をコピーするコールバック */
  onCopy: () => void;
}

interface PreviousCardioRecordCardProps {
  /** 前回の有酸素種目記録 */
  records: CardioRecord[];
  /** 前回記録の日付 */
  date: Date;
  /** 前回記録をコピーするコールバック */
  onCopy: () => void;
}

/**
 * 日付をフォーマットする
 */
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

/**
 * 前回の筋トレ種目記録カードコンポーネント
 */
export function PreviousWorkoutRecordCard({
  sets,
  date,
  onCopy,
}: PreviousWorkoutRecordCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold">前回記録</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(date)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="text-xs h-7"
          >
            前回をコピー
          </Button>
        </div>

        <div className="space-y-2">
          {sets.map((set, index) => {
            const oneRM =
              set.weight && set.weight > 0 && set.reps > 0
                ? calculate1RM(set.weight, set.reps)
                : null;

            return (
              <div
                key={set.id || index}
                className="flex items-center justify-between text-sm py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-6">
                    {set.setOrder || index + 1}
                  </span>
                  {set.weight !== undefined && set.weight !== null ? (
                    <>
                      <span className="font-medium">{set.weight}kg</span>
                      <span className="text-muted-foreground">×</span>
                      <span className="font-medium">{set.reps}回</span>
                    </>
                  ) : set.duration !== undefined && set.duration !== null ? (
                    <span className="font-medium">{set.duration}秒</span>
                  ) : (
                    <span className="font-medium">{set.reps}回</span>
                  )}
                </div>
                {oneRM && (
                  <span className="text-xs text-muted-foreground">
                    1RM: {oneRM}kg
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 前回の有酸素種目記録カードコンポーネント
 */
export function PreviousCardioRecordCard({
  records,
  date,
  onCopy,
}: PreviousCardioRecordCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold">前回記録</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(date)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="text-xs h-7"
          >
            前回をコピー
          </Button>
        </div>

        <div className="space-y-2">
          {records.map((record, index) => {
            const speed =
              record.distance !== null &&
              record.distance !== undefined &&
              record.distance > 0 &&
              record.duration > 0
                ? Math.round((record.distance / (record.duration / 60)) * 10) /
                  10
                : null;

            return (
              <div
                key={record.id || index}
                className="flex items-center justify-between text-sm py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-6">{index + 1}</span>
                  <span className="font-medium">{record.duration}分</span>
                  {record.distance !== null &&
                    record.distance !== undefined && (
                      <>
                        <span className="text-muted-foreground">×</span>
                        <span className="font-medium">{record.distance}km</span>
                      </>
                    )}
                </div>
                {speed && (
                  <span className="text-xs text-muted-foreground">
                    {speed}km/h
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
