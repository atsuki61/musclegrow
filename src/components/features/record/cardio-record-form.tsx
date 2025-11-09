"use client";

import { useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import type { CardioRecord } from "@/types/workout";

interface CardioRecordFormProps {
  /** 有酸素種目の記録リスト */
  records: CardioRecord[];
  /** 記録リストを更新するコールバック */
  onRecordsChange: (records: CardioRecord[]) => void;
}

/**
 * 入力値を数値に変換する
 * NaN、無限大、負の値を0に変換して安全性を確保
 */
const parseNumber = (value: string): number => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

/**
 * 入力値の長さに応じてフォントサイズのクラスを返す
 */
const getFontSizeClass = (value: number | string | undefined): string => {
  const valueStr = value?.toString() || "";
  const length = valueStr.length;

  if (length === 0 || length <= 3) {
    return "text-base sm:text-lg";
  }
  if (length <= 5) {
    return "text-sm sm:text-base";
  }
  return "text-xs sm:text-sm";
};

/**
 * 距離と時間から速度を計算する（km/h）
 */
const calculateSpeed = (distance: number, duration: number): number | null => {
  if (distance <= 0 || duration <= 0) return null;
  // 時間が分単位なので、時間に変換してから計算
  const hours = duration / 60;
  const speed = distance / hours;
  return Math.round(speed * 10) / 10; // 小数点第1位で四捨五入
};

interface CardioRecordRowProps {
  /** 有酸素種目の記録 */
  record: CardioRecord;
  /** 最後の記録かどうか */
  isLast: boolean;
  /** 記録の値を更新するコールバック */
  onRecordChange: (
    recordId: string,
    field: keyof CardioRecord,
    value: number | string | Date | null
  ) => void;
  /** 記録を削除するコールバック */
  onDelete: (recordId: string) => void;
  /** 記録行のref（自動スクロール用） */
  recordRowRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * 有酸素種目の記録行コンポーネント
 */
function CardioRecordRow({
  record,
  isLast,
  onRecordChange,
  onDelete,
  recordRowRef,
}: CardioRecordRowProps) {
  const speed = calculateSpeed(
    record.distance ?? 0,
    record.duration
  );

  return (
    <div ref={recordRowRef}>
      <div className="flex items-start sm:items-end gap-2">
        {/* 時間入力 */}
        <div className="flex-1">
          <Input
            type="number"
            placeholder="時間"
            value={record.duration || ""}
            onChange={(e) => {
              const value = parseNumber(e.target.value);
              onRecordChange(record.id, "duration", value);
            }}
            min="0"
            step="1"
            className={`${getFontSizeClass(
              record.duration
            )} placeholder:text-xs sm:placeholder:text-sm h-9 text-center`}
          />
          <span className="text-xs text-muted-foreground mt-0.5 block text-right">
            分
          </span>
        </div>

        {/* ×記号 */}
        <span className="text-lg font-bold text-muted-foreground pb-1">×</span>

        {/* 距離入力 */}
        <div className="flex-1">
          <Input
            type="number"
            placeholder="距離"
            value={record.distance || ""}
            onChange={(e) => {
              const value = parseNumber(e.target.value);
              onRecordChange(record.id, "distance", value);
            }}
            min="0"
            step="0.1"
            className={`${getFontSizeClass(
              record.distance ?? undefined
            )} placeholder:text-xs sm:placeholder:text-sm h-9 text-center`}
          />
          <span className="text-xs text-muted-foreground mt-0.5 block text-right">
            km
          </span>
        </div>

        {/* 速度表示 */}
        <div className="w-20 shrink-0 text-center pb-1">
          {speed ? (
            <div>
              <div className="text-base font-semibold">{speed}km/h</div>
              <span className="text-xs text-muted-foreground">速度</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">--</div>
          )}
        </div>

        {/* 削除ボタン */}
        <div className="shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(record.id)}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            aria-label="記録を削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* カロリー・心拍数・傾斜入力（オプション） */}
      <div className="flex gap-2 mt-3">
        <div className="flex-1">
          <Input
            type="number"
            placeholder="消費カロリー（オプション）"
            value={record.calories || ""}
            onChange={(e) => {
              const value = parseNumber(e.target.value);
              onRecordChange(record.id, "calories", value || null);
            }}
            min="0"
            step="1"
            className="text-sm h-9"
          />
          <span className="text-xs text-muted-foreground mt-0.5 block">
            kcal
          </span>
        </div>
        <div className="flex-1">
          <Input
            type="number"
            placeholder="心拍数（オプション）"
            value={record.heartRate || ""}
            onChange={(e) => {
              const value = parseNumber(e.target.value);
              onRecordChange(record.id, "heartRate", value || null);
            }}
            min="0"
            step="1"
            className="text-sm h-9"
          />
          <span className="text-xs text-muted-foreground mt-0.5 block">
            bpm
          </span>
        </div>
        <div className="flex-1">
          <Input
            type="number"
            placeholder="傾斜（オプション）"
            value={record.incline || ""}
            onChange={(e) => {
              const value = parseNumber(e.target.value);
              onRecordChange(record.id, "incline", value || null);
            }}
            min="0"
            max="30"
            step="0.5"
            className="text-sm h-9"
          />
          <span className="text-xs text-muted-foreground mt-0.5 block">
            %
          </span>
        </div>
      </div>

      {!isLast && <Separator className="mt-3" />}
    </div>
  );
}

/**
 * 有酸素種目記録フォームコンポーネント
 * 時間、距離、速度、消費カロリー、心拍数を入力
 */
export function CardioRecordForm({
  records,
  onRecordsChange,
}: CardioRecordFormProps) {
  // 最後の記録へのref（自動スクロール用）
  const lastRecordRef = useRef<HTMLDivElement>(null);
  // 前回の記録数を追跡（記録追加を検知するため）
  const previousRecordsLengthRef = useRef<number>(records.length);

  /**
   * 新しい記録を作成する
   */
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

  /**
   * 記録を追加する
   */
  const handleAddRecord = () => {
    const newRecord = createNewRecord();
    onRecordsChange([...records, newRecord]);
  };

  /**
   * 記録が追加された際に、最後の記録まで自動スクロール
   */
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

  /**
   * 記録を削除する
   */
  const handleDeleteRecord = (recordId: string) => {
    const filteredRecords = records.filter((record) => record.id !== recordId);
    onRecordsChange(filteredRecords);
  };

  /**
   * 記録の値を更新する
   */
  const handleRecordChange = (
    recordId: string,
    field: keyof CardioRecord,
    value: number | string | Date | null
  ) => {
    const updatedRecords = records.map((record) => {
      if (record.id === recordId) {
        const updated = { ...record, [field]: value };
        // 距離と時間が両方入力されている場合、速度を自動計算
        if (field === "distance" || field === "duration") {
          const distance = field === "distance" ? (value as number) : updated.distance ?? 0;
          const duration = field === "duration" ? (value as number) : updated.duration;
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
      {/* セクションタイトル */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏃</span>
        <h3 className="font-semibold text-lg">今日の記録</h3>
      </div>

      {/* 記録カード（1枚） */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">記録を追加してください</p>
            </div>
          ) : (
            <div className="space-y-[10px]">
              {records.map((record, index) => {
                const isLast = index === records.length - 1;
                return (
                  <CardioRecordRow
                    key={record.id}
                    record={record}
                    isLast={isLast}
                    onRecordChange={handleRecordChange}
                    onDelete={handleDeleteRecord}
                    recordRowRef={isLast ? lastRecordRef : undefined}
                  />
                );
              })}
            </div>
          )}

          {/* 記録追加ボタン（カード内） */}
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              onClick={handleAddRecord}
              className="w-full"
              disabled={records.length >= 10}
            >
              <Plus className="h-4 w-4 mr-2" />
              記録を追加
            </Button>

            {records.length >= 10 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                最大10件まで追加できます
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

