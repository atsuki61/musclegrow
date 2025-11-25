"use client";

import { useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Timer } from "lucide-react";
import type { CardioRecord } from "@/types/workout";

interface CardioRecordFormProps {
  records: CardioRecord[];
  onRecordsChange: (records: CardioRecord[]) => void;
}

const parseNumber = (value: string): number => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const calculateSpeed = (distance: number, duration: number): number | null => {
  if (distance <= 0 || duration <= 0) return null;
  const hours = duration / 60;
  const speed = distance / hours;
  return Math.round(speed * 10) / 10;
};

interface CardioRecordRowProps {
  record: CardioRecord;
  isLast: boolean;
  onRecordChange: (
    recordId: string,
    field: keyof CardioRecord,
    value: number | string | Date | null
  ) => void;
  onDelete: (recordId: string) => void;
  recordRowRef?: React.RefObject<HTMLDivElement | null>;
}

function CardioRecordRow({
  record,
  isLast,
  onRecordChange,
  onDelete,
  recordRowRef,
}: CardioRecordRowProps) {
  const speed = calculateSpeed(record.distance ?? 0, record.duration);

  return (
    <div
      ref={recordRowRef}
      className="group relative animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex flex-col gap-2 py-1">
        {/* メイン入力 (時間 x 距離) */}
        <div className="flex items-center gap-2">
          {/* 時間 */}
          <div className="relative flex-1">
            <Input
              type="number"
              value={record.duration || ""}
              onChange={(e) =>
                onRecordChange(
                  record.id,
                  "duration",
                  parseNumber(e.target.value)
                )
              }
              // コンパクト化: h-14 -> h-10, text-xl -> text-lg
              className="h-10 text-center text-lg font-bold bg-muted/30 border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-lg pr-8"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
              分
            </span>
          </div>

          <span className="text-muted-foreground font-bold text-sm">×</span>

          {/* 距離 */}
          <div className="relative flex-1">
            <Input
              type="number"
              value={record.distance || ""}
              onChange={(e) =>
                onRecordChange(
                  record.id,
                  "distance",
                  parseNumber(e.target.value)
                )
              }
              className="h-10 text-center text-lg font-bold bg-muted/30 border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-lg pr-8"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
              km
            </span>
          </div>

          {/* 削除ボタン */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(record.id)}
            className="h-8 w-8 shrink-0 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* サブ情報 (速度・カロリー・心拍) */}
        <div className="grid grid-cols-3 gap-2">
          {/* 速度表示 */}
          <div className="bg-muted/20 rounded-lg p-1 text-center border border-border/30 flex flex-col justify-center h-9">
            <span className="text-[9px] text-muted-foreground block leading-none mb-0.5">
              速度
            </span>
            <span className="text-xs font-bold leading-none">
              {speed ? `${speed}km/h` : "--"}
            </span>
          </div>

          {/* カロリー */}
          <div className="relative">
            <Input
              type="number"
              value={record.calories || ""}
              onChange={(e) =>
                onRecordChange(
                  record.id,
                  "calories",
                  parseNumber(e.target.value) || null
                )
              }
              className="h-9 text-center text-xs bg-muted/10 border-border/30 rounded-lg pr-6"
              placeholder="-"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground pointer-events-none">
              kcal
            </span>
          </div>

          {/* 心拍数 */}
          <div className="relative">
            <Input
              type="number"
              value={record.heartRate || ""}
              onChange={(e) =>
                onRecordChange(
                  record.id,
                  "heartRate",
                  parseNumber(e.target.value) || null
                )
              }
              className="h-9 text-center text-xs bg-muted/10 border-border/30 rounded-lg pr-6"
              placeholder="-"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground pointer-events-none">
              bpm
            </span>
          </div>
        </div>
      </div>

      {!isLast && <Separator className="my-2 opacity-30" />}
    </div>
  );
}

export function CardioRecordForm({
  records,
  onRecordsChange,
}: CardioRecordFormProps) {
  const lastRecordRef = useRef<HTMLDivElement>(null);
  const previousRecordsLengthRef = useRef<number>(records.length);

  const createNewRecord = (): CardioRecord => ({
    id: nanoid(),
    duration: 0,
    distance: null,
    speed: null,
    calories: null,
    heartRate: null,
    incline: null,
    notes: null,
    date: new Date(),
  });

  const handleAddRecord = () =>
    onRecordsChange([...records, createNewRecord()]);

  useEffect(() => {
    if (
      records.length > previousRecordsLengthRef.current &&
      lastRecordRef.current
    ) {
      setTimeout(() => {
        lastRecordRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
    previousRecordsLengthRef.current = records.length;
  }, [records.length]);

  const handleDeleteRecord = (recordId: string) => {
    onRecordsChange(records.filter((record) => record.id !== recordId));
  };

  const handleRecordChange = (
    recordId: string,
    field: keyof CardioRecord,
    value: number | string | Date | null
  ) => {
    const updatedRecords = records.map((record) => {
      if (record.id === recordId) {
        const updated = { ...record, [field]: value };
        if (field === "distance" || field === "duration") {
          const distance =
            field === "distance" ? (value as number) : updated.distance ?? 0;
          const duration =
            field === "duration" ? (value as number) : updated.duration;
          updated.speed = calculateSpeed(distance, duration);
        }
        return updated;
      }
      return record;
    });
    onRecordsChange(updatedRecords);
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-none sm:border sm:shadow-sm bg-transparent sm:bg-card">
        <div className="p-0 sm:p-4 space-y-2">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-muted rounded-xl bg-muted/10">
              <Timer className="w-8 h-8 text-muted-foreground/20 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                最初の記録を追加しよう
              </p>
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-3 shadow-sm space-y-1">
              {records.map((record, index) => (
                <CardioRecordRow
                  key={record.id}
                  record={record}
                  isLast={index === records.length - 1}
                  onRecordChange={handleRecordChange}
                  onDelete={handleDeleteRecord}
                  recordRowRef={
                    index === records.length - 1 ? lastRecordRef : undefined
                  }
                />
              ))}
            </div>
          )}

          <Button
            onClick={handleAddRecord}
            className="w-full h-10 mt-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-bold shadow-none text-sm"
            variant="outline"
            disabled={records.length >= 10}
          >
            <Plus className="w-4 h-4 mr-2" />
            記録を追加
          </Button>
        </div>
      </Card>
    </div>
  );
}
