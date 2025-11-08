"use client";

import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Copy, Trash2 } from "lucide-react";
import { calculate1RM } from "@/lib/utils";
import type { SetRecord } from "@/types/workout";

interface SetRecordFormProps {
  /** セット記録のリスト */
  sets: SetRecord[];
  /** セット記録のリストを更新するコールバック */
  onSetsChange: (sets: SetRecord[]) => void;
}

interface SetRowProps {
  /** セット記録 */
  set: SetRecord;
  /** セットのインデックス */
  index: number;
  /** 最後のセットかどうか */
  isLast: boolean;
  /** 前のセットが存在するかどうか */
  hasPreviousSet: boolean;
  /** セットの値を更新するコールバック */
  onSetChange: (
    setId: string,
    field: keyof SetRecord,
    value: number | string | boolean
  ) => void;
  /** 前のセットをコピーするコールバック */
  onCopyPrevious: (index: number) => void;
  /** セットを削除するコールバック */
  onDelete: (setId: string) => void;
}

/**
 * 入力値を数値に変換する（重量用）
 */
const parseWeight = (value: string): number => {
  return parseFloat(value) || 0;
};

/**
 * 入力値を数値に変換する（回数用）
 */
const parseReps = (value: string): number => {
  return parseInt(value, 10) || 0;
};

/**
 * セット行コンポーネント
 * 1つのセットの入力フィールドとアクションボタンを表示
 */
function SetRow({
  set,
  index,
  isLast,
  hasPreviousSet,
  onSetChange,
  onCopyPrevious,
  onDelete,
}: SetRowProps) {
  const oneRM = calculate1RM(set.weight, set.reps);

  return (
    <div>
      {/* セット行 */}
      <div className="flex items-start sm:items-end gap-1.5">
        {/* コピーと番号をまとめたカラム（1セット目でも同じ幅を確保） */}
        <div className="w-10 shrink-0 flex flex-col items-center">
          {/* コピーボタン（最初のセット以外）または透明なプレースホルダー */}
          {hasPreviousSet ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyPrevious(index)}
              className="h-7 w-7 p-0 mb-1"
              aria-label="前のセットをコピー"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="h-7 w-7 mb-1" aria-hidden="true" />
          )}
          {/* セット番号 */}
          <span className="text-sm font-medium text-muted-foreground">
            {index + 1}
          </span>
        </div>

        {/* 重量入力 */}
        <div className="flex-1">
          <Input
            type="number"
            placeholder="重量"
            value={set.weight || ""}
            onChange={(e) => {
              const value = parseWeight(e.target.value);
              onSetChange(set.id, "weight", value);
            }}
            min="0"
            step="0.5"
            className="text-base h-9"
          />
          <span className="text-xs text-muted-foreground mt-0.5 block text-right">
            kg
          </span>
        </div>

        {/* ×記号 */}
        <span className="text-lg font-bold text-muted-foreground pb-1">×</span>

        {/* 回数入力 */}
        <div className="flex-1">
          <Input
            type="number"
            placeholder="回数"
            value={set.reps || ""}
            onChange={(e) => {
              const value = parseReps(e.target.value);
              onSetChange(set.id, "reps", value);
            }}
            min="0"
            step="1"
            className="text-base h-9"
          />
          <span className="text-xs text-muted-foreground mt-0.5 block text-right">
            回
          </span>
        </div>

        {/* 1RM表示 */}
        <div className="flex-1 text-center pb-1">
          {oneRM ? (
            <div>
              <div className="text-base font-semibold">{oneRM}kg</div>
              <span className="text-xs text-muted-foreground">1RM</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">--</div>
          )}
        </div>

        {/* 削除ボタン（右端） */}
        <div className="shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(set.id)}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            aria-label="セットを削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* セット間の区切り線（最後のセット以外） */}
      {!isLast && <Separator className="mt-3" />}
    </div>
  );
}

/**
 * セット記録フォームコンポーネント
 * 筋トレ種目用の重量×回数入力フォーム
 */
export function SetRecordForm({ sets, onSetsChange }: SetRecordFormProps) {
  /**
   * 新しいセットを作成する
   */
  const createNewSet = (setOrder: number): SetRecord => ({
    id: nanoid(),
    setOrder,
    weight: 0,
    reps: 0,
    isWarmup: false,
    failure: false,
  });

  /**
   * セット順序を再計算する
   */
  const reorderSets = (setsToReorder: SetRecord[]): SetRecord[] => {
    return setsToReorder.map((set, index) => ({
      ...set,
      setOrder: index + 1,
    }));
  };

  /**
   * セットを追加する
   */
  const handleAddSet = () => {
    const newSet = createNewSet(sets.length + 1);
    onSetsChange([...sets, newSet]);
  };

  /**
   * セットを削除する
   */
  const handleDeleteSet = (setId: string) => {
    const filteredSets = sets.filter((set) => set.id !== setId);
    onSetsChange(reorderSets(filteredSets));
  };

  /**
   * セットの値を更新する
   */
  const handleSetChange = (
    setId: string,
    field: keyof SetRecord,
    value: number | string | boolean
  ) => {
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, [field]: value } : set
    );
    onSetsChange(updatedSets);
  };

  /**
   * 前のセットの値をコピーする
   */
  const handleCopyPreviousSet = (index: number) => {
    if (index === 0) return; // 最初のセットはコピー元がない

    const previousSet = sets[index - 1];
    const currentSet = sets[index];

    // 1回の更新で複数フィールドを変更
    const updatedSets = sets.map((set) =>
      set.id === currentSet.id
        ? { ...set, weight: previousSet.weight, reps: previousSet.reps }
        : set
    );
    onSetsChange(updatedSets);
  };

  return (
    <div className="space-y-4">
      {/* セクションタイトル */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">✨</span>
        <h3 className="font-semibold text-lg">今日の記録</h3>
      </div>

      {/* セット記録カード（1枚） */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          {sets.length === 0 ? (
            /* セットが0件の場合 */
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">セットを追加してください</p>
            </div>
          ) : (
            /* セットリスト */
            <div className="space-y-3">
              {sets.map((set, index) => (
                <SetRow
                  key={set.id}
                  set={set}
                  index={index}
                  isLast={index === sets.length - 1}
                  hasPreviousSet={index > 0}
                  onSetChange={handleSetChange}
                  onCopyPrevious={handleCopyPreviousSet}
                  onDelete={handleDeleteSet}
                />
              ))}
            </div>
          )}

          {/* セット追加ボタン（カード内） */}
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              onClick={handleAddSet}
              className="w-full"
              disabled={sets.length >= 50} // 最大50セットまで
            >
              <Plus className="h-4 w-4 mr-2" />
              セットを追加
            </Button>

            {/* 最大セット数に達した場合のメッセージ */}
            {sets.length >= 50 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                最大50セットまで追加できます
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
