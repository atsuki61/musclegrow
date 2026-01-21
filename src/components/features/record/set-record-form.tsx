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
// セット入力は多くても現実的に 50 までに制限
const MAX_SETS = 50;

// 入力欄に「次のセットを出すべき値」が入っているか（0 は未入力扱い）
function hasAnyPositiveInputValue(set: SetRecord): boolean {
  const weight = Number(set.weight ?? 0);
  const reps = Number(set.reps ?? 0);
  const duration = Number(set.duration ?? 0);
//数値が有限かつ0より大きいかどうか
  const hasWeight = Number.isFinite(weight) && weight > 0;
  const hasReps = Number.isFinite(reps) && reps > 0;
  const hasDuration = Number.isFinite(duration) && duration > 0;

  return hasWeight || hasReps || hasDuration;
}
//セット行のプロパティ
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
//セット行
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
  const needsWeight = requiresWeightInput(exercise);//重量入力が必要かどうか
  const isTimeBased = isTimeBasedExercise(exercise);//時間制の種目かどうか
  const isBodyweight = isBodyweightExercise(exercise);//自重種目かどうか
  const oneRM =
    set.weight && set.weight > 0 ? calculate1RM(set.weight, set.reps) : null;//1RMを計算

  return (//セット行を返す
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
      weight: undefined,
      reps: 0,
      duration: isTimeBased ? 0 : undefined,
      isWarmup: false,
      failure: false,
    };
  };

  // 「最後の行が埋まったら次の空セットを 1 行だけ追加」する共通処理
  //入力とコピーの両方で同じ挙動にするために関数化
  const maybeAppendNextEmptySet = (
    updatedSets: SetRecord[],
    changedSetId: string
  ): SetRecord[] => {
    if (updatedSets.length >= MAX_SETS) return updatedSets;

    const changedIndex = updatedSets.findIndex((set) => set.id === changedSetId);
    if (changedIndex === -1) return updatedSets;

    const isLastRow = changedIndex === updatedSets.length - 1;
    if (!isLastRow) return updatedSets;

    if (!hasAnyPositiveInputValue(updatedSets[changedIndex])) return updatedSets;

    return [...updatedSets, createNewSet(updatedSets.length + 1)];
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
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, [field]: value } : set
    );

    // 数値入力（重量/回数/時間）のときだけ「次セットの自動追加」を判定する
    const nextSets =
      field === "weight" || field === "reps" || field === "duration"
        ? maybeAppendNextEmptySet(updatedSets, setId)
        : updatedSets;

    onSetsChange(nextSets);
  };
//前回記録をコピー
  const handleCopyPreviousSet = (index: number) => {
    if (index === 0) return;
    const previousSet = sets[index - 1];
    const currentSet = sets[index];
    const isTimeBased = isTimeBasedExercise(exercise);//時間制の種目かどうか
    //セットを更新
    const updatedSets = sets.map((set) => {
      if (set.id === currentSet.id) {//もしセットidが一致したら
        const updated: SetRecord = { ...set };//セットを更新
        if (isTimeBased) {//時間制の種目なら
          updated.duration = previousSet.duration;//時間を更新
        } else {//重量制の種目なら
          updated.weight = previousSet.weight;//重量を更新
          updated.reps = previousSet.reps;//回数を更新
        }
        return updated;//更新したセットを返す
      }
      return set;//セットを返す
    });
    onSetsChange(maybeAppendNextEmptySet(updatedSets, currentSet.id));//セットを更新
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
            disabled={sets.length >= MAX_SETS}
          >
            <Plus className="w-4 h-4 mr-2" />
            セットを追加
          </Button>
        </div>
      </Card>
    </div>
  );
}
