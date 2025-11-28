"use client";

import { Button } from "@/components/ui/button";
import { calculate1RM } from "@/lib/utils";
import type { SetRecord, CardioRecord } from "@/types/workout";
import { Copy } from "lucide-react";

interface PreviousWorkoutRecordCardProps {
  sets: SetRecord[];
  date: Date;
  onCopy: () => void;
  hideHeader?: boolean;
}

interface PreviousCardioRecordCardProps {
  records: CardioRecord[];
  date: Date;
  onCopy: () => void;
  hideHeader?: boolean;
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

export function PreviousWorkoutRecordCard({
  sets,
  date,
  onCopy,
  hideHeader = false,
}: PreviousWorkoutRecordCardProps) {
  return (
    <div className="space-y-1">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            {/* 修正: text-muted-foreground から text-primary に変更 */}
            <span className="text-xs font-bold text-primary">
              前回: {formatDate(date)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            // 修正: ボタンもprimary色に
            className="h-6 text-xs gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Copy className="w-3 h-3" /> コピー
          </Button>
        </div>
      )}

      {/* 記録リスト */}
      <div className="grid grid-cols-1 gap-1">
        {sets.map((set, index) => {
          const oneRM =
            set.weight && set.weight > 0 && set.reps > 0
              ? calculate1RM(set.weight, set.reps)
              : null;

          return (
            <div
              key={set.id || index}
              className="flex items-center justify-between text-xs py-0.5"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/50 w-3 font-medium text-[10px]">
                  {index + 1}
                </span>
                <div className="font-medium text-foreground/90">
                  {set.weight !== undefined && set.weight !== null ? (
                    <>
                      {set.weight}
                      <span className="text-[10px] text-muted-foreground ml-0.5">
                        kg
                      </span>
                      <span className="mx-1 text-muted-foreground/50">×</span>
                      {set.reps}
                      <span className="text-[10px] text-muted-foreground ml-0.5">
                        回
                      </span>
                    </>
                  ) : set.duration !== undefined && set.duration !== null ? (
                    <>
                      {set.duration}
                      <span className="text-[10px] text-muted-foreground ml-0.5">
                        秒
                      </span>
                    </>
                  ) : (
                    <>
                      {set.reps}
                      <span className="text-[10px] text-muted-foreground ml-0.5">
                        回
                      </span>
                    </>
                  )}
                </div>
              </div>
              {oneRM && (
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  1RM: {oneRM}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PreviousCardioRecordCard({
  records,
  date,
  onCopy,
  hideHeader = false,
}: PreviousCardioRecordCardProps) {
  return (
    <div className="space-y-1">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
          <span className="text-xs font-bold text-primary">
            前回: {formatDate(date)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-6 text-xs gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Copy className="w-3 h-3" /> コピー
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-1">
        {records.map((record, index) => {
          const speed =
            record.distance && record.duration > 0
              ? Math.round((record.distance / (record.duration / 60)) * 10) / 10
              : null;

          return (
            <div
              key={record.id || index}
              className="flex items-center justify-between text-xs py-0.5"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/50 w-3 font-medium text-[10px]">
                  {index + 1}
                </span>
                <div className="font-medium text-foreground/90">
                  {record.duration}
                  <span className="text-[10px] text-muted-foreground ml-0.5">
                    分
                  </span>
                  {record.distance && (
                    <>
                      <span className="mx-1 text-muted-foreground/50">×</span>
                      {record.distance}
                      <span className="text-[10px] text-muted-foreground ml-0.5">
                        km
                      </span>
                    </>
                  )}
                </div>
              </div>
              {speed && (
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {speed}km/h
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
