"use client";

import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Copy, Trash2 } from "lucide-react";
import { calculate1RM } from "@/lib/utils";
import type { SetRecord } from "@/types/workout";

interface SetRecordFormProps {
  /** セット記録のリスト */
  sets: SetRecord[];
  /** セット記録のリストを更新するコールバック */
  onSetsChange: (sets: SetRecord[]) => void;
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

      {/* セットリスト */}
      <div className="space-y-3">
        {sets.map((set, index) => {
          const oneRM = calculate1RM(set.weight, set.reps);

          return (
            <Card key={set.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* セットヘッダー */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-lg">セット{index + 1}</span>
                  <div className="flex gap-2">
                    {/* コピーボタン（最初のセット以外） */}
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyPreviousSet(index)}
                        className="h-8 w-8 p-0"
                        aria-label="前のセットをコピー"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {/* 削除ボタン */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSet(set.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      aria-label="セットを削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 入力フィールド */}
                <div className="flex items-center gap-2">
                  {/* 重量入力 */}
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="重量"
                      value={set.weight || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleSetChange(set.id, "weight", value);
                      }}
                      min="0"
                      step="0.5"
                      className="text-lg"
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">
                      kg
                    </span>
                  </div>

                  {/* ×記号 */}
                  <span className="text-xl font-bold text-muted-foreground">
                    ×
                  </span>

                  {/* 回数入力 */}
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="回数"
                      value={set.reps || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10) || 0;
                        handleSetChange(set.id, "reps", value);
                      }}
                      min="0"
                      step="1"
                      className="text-lg"
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">
                      回
                    </span>
                  </div>

                  {/* 1RM表示 */}
                  <div className="flex-1 text-center">
                    {oneRM ? (
                      <div>
                        <div className="text-lg font-semibold">{oneRM}kg</div>
                        <span className="text-xs text-muted-foreground">
                          1RM
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">--</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* セット追加ボタン */}
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
        <p className="text-xs text-muted-foreground text-center">
          最大50セットまで追加できます
        </p>
      )}
    </div>
  );
}
