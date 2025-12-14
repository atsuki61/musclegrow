"use client";

import { useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Dumbbell } from "lucide-react";
import {
  calculate1RM,
  requiresWeightInput,
  isTimeBasedExercise,
  isBodyweightExercise,
} from "@/lib/utils";
import type { Exercise, SetRecord } from "@/types/workout";

interface SetRecordFormProps {
  exercise: Exercise;
  sets: SetRecord[];
  onSetsChange: (sets: SetRecord[]) => void;
  isLoading?: boolean;
}

interface SetRowProps {
  exercise: Exercise;
  set: SetRecord;
  index: number;
  isLast: boolean;
  hasPreviousSet: boolean;
  onSetChange: (
    setId: string,
    field: keyof SetRecord,
    value: number | string | boolean
  ) => void;
  onCopyPrevious: (index: number) => void;
  onDelete: (setId: string) => void;
  setRowRef?: React.RefObject<HTMLDivElement | null>;
}

function SetRow({
  exercise,
  set,
  index,
  isLast,
  hasPreviousSet,
  onSetChange,
  onCopyPrevious,
  onDelete,
  setRowRef,
}: SetRowProps) {
  const needsWeight = requiresWeightInput(exercise);
  const isTimeBased = isTimeBasedExercise(exercise);
  const isBodyweight = isBodyweightExercise(exercise);
  const oneRM =
    set.weight && set.weight > 0 ? calculate1RM(set.weight, set.reps) : null;

  return (
    <div
      ref={setRowRef}
      className="group relative animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-center gap-2 py-0.5">
        {/* 1. セット番号とコピーボタン */}
        <div className="w-8 flex flex-col items-center gap-0.5 shrink-0">
          <span className="text-xs font-bold text-muted-foreground bg-muted/40 w-5 h-5 flex items-center justify-center rounded-full">
            {index + 1}
          </span>
          {hasPreviousSet && (
            <button
              onClick={() => onCopyPrevious(index)}
              className="text-[9px] text-primary font-bold hover:bg-primary/10 px-1 py-0.5 rounded transition-colors"
            >
              COPY
            </button>
          )}
        </div>

        {/* 2. 入力フィールド群 */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {/* 重量 */}
          {needsWeight && (
            <div className="relative">
              <Input
                type="number"
                value={set.weight || ""}
                onChange={(e) =>
                  onSetChange(set.id, "weight", parseFloat(e.target.value))
                }
                className="h-10 text-center text-base font-bold bg-muted/30 border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-lg pr-6"
                placeholder={isBodyweight ? "-" : "0"}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none">
                kg
              </span>
            </div>
          )}

          {/* 回数 / 時間 */}
          <div className="relative">
            <Input
              type="number"
              value={isTimeBased ? set.duration || "" : set.reps || ""}
              onChange={(e) =>
                onSetChange(
                  set.id,
                  isTimeBased ? "duration" : "reps",
                  parseFloat(e.target.value)
                )
              }
              // h-12 -> h-10, text-lg -> text-base でコンパクト化
              className="h-10 text-center text-base font-bold bg-muted/30 border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-lg pr-6"
              placeholder="0"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none">
              {isTimeBased ? "秒" : "回"}
            </span>
          </div>
        </div>

        {/* 3. 削除アクション */}
        <div className="shrink-0 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(set.id)}
            className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 1RMなどの補足情報 */}
      {oneRM && (
        <div className="ml-10 -mt-0.5 mb-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="bg-muted/50 px-1.5 py-0 rounded">
            1RM: {Math.round(oneRM)}kg
          </span>
        </div>
      )}

      {!isLast && <Separator className="my-2 opacity-30" />}
    </div>
  );
}

export function SetRecordForm({
  exercise,
  sets,
  onSetsChange,
  isLoading = false,
}: SetRecordFormProps) {
  const lastSetRef = useRef<HTMLDivElement>(null);
  const previousSetsLengthRef = useRef<number>(sets.length);

  const createNewSet = (setOrder: number): SetRecord => {
    const isTimeBased = isTimeBasedExercise(exercise);
    return {
      id: nanoid(),
      setOrder,
      weight: isTimeBased ? undefined : undefined,
      reps: 0,
      duration: isTimeBased ? 0 : undefined,
      isWarmup: false,
      failure: false,
    };
  };

  const handleAddSet = () => {
    onSetsChange([...sets, createNewSet(sets.length + 1)]);
  };

  useEffect(() => {
    if (sets.length > previousSetsLengthRef.current && lastSetRef.current) {
      setTimeout(() => {
        lastSetRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
    previousSetsLengthRef.current = sets.length;
  }, [sets.length]);

  const handleDeleteSet = (setId: string) => {
    const filteredSets = sets.filter((set) => set.id !== setId);
    const reordered = filteredSets.map((set, idx) => ({
      ...set,
      setOrder: idx + 1,
    }));
    onSetsChange(reordered);
  };
  //入力変更時のハンドラー
  const handleSetChange = (
    setId: string,
    field: keyof SetRecord,
    value: number | string | boolean
  ) => {
    // 1. まず現在のセットを更新
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, [field]: value } : set
    );

    // 2. 自動追加の判定
    // 編集中のセットが最後の行か調べる
    const targetSetIndex = sets.findIndex((s) => s.id === setId);
    const isLastSet = targetSetIndex === sets.length - 1;

    // 重量、回数、時間のどれかが入力されて、それが0より大きい値になったら
    if (
      isLastSet &&
      (field === "weight" || field === "reps" || field === "duration")
    ) {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > 0) {
        // 50セット以内なら新しいセットを追加
        if (updatedSets.length < 50) {
          updatedSets.push(createNewSet(updatedSets.length + 1));
        }
      }
    }

    onSetsChange(updatedSets);
  };

  const handleCopyPreviousSet = (index: number) => {
    if (index === 0) return;
    const previousSet = sets[index - 1];
    const currentSet = sets[index];
    const isTimeBased = isTimeBasedExercise(exercise);

    const updatedSets = sets.map((set) => {
      if (set.id === currentSet.id) {
        const updated: SetRecord = { ...set };
        if (isTimeBased) {
          updated.duration = previousSet.duration;
        } else {
          updated.weight = previousSet.weight;
          updated.reps = previousSet.reps;
        }
        return updated;
      }
      return set;
    });
    onSetsChange(updatedSets);
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-none sm:border sm:shadow-sm bg-transparent sm:bg-card">
        <div className="p-0 sm:p-4 space-y-2">
          {isLoading ? null : sets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-muted rounded-xl bg-muted/10">
              <Dumbbell className="w-8 h-8 text-muted-foreground/20 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                最初のセットを追加しよう
              </p>
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-3 shadow-sm space-y-1">
              {sets.map((set, index) => {
                const isLast = index === sets.length - 1;
                return (
                  <SetRow
                    key={set.id}
                    exercise={exercise}
                    set={set}
                    index={index}
                    isLast={isLast}
                    hasPreviousSet={index > 0}
                    onSetChange={handleSetChange}
                    onCopyPrevious={handleCopyPreviousSet}
                    onDelete={handleDeleteSet}
                    setRowRef={isLast ? lastSetRef : undefined}
                  />
                );
              })}
            </div>
          )}

          <Button
            onClick={handleAddSet}
            className="w-full h-10 mt-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-bold shadow-none text-sm"
            variant="outline"
            disabled={sets.length >= 50}
          >
            <Plus className="w-4 h-4 mr-2" />
            セットを追加
          </Button>
        </div>
      </Card>
    </div>
  );
}
