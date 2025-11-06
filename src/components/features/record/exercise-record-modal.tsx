"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, BarChart3, Settings } from "lucide-react";
import { isCardioExercise } from "@/lib/utils";
import type { Exercise } from "@/types/workout";

interface ExerciseRecordModalProps {
  /** 選択された種目 */
  exercise: Exercise | null;
  /** モーダルの開閉状態 */
  isOpen: boolean;
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
}

/**
 * 種目記録モーダルコンポーネント
 * 種目をタップした際に表示される、セット記録の入力モーダル
 *
 * 有酸素種目と筋トレ種目で異なる入力フォームを表示（isCardioフラグで分岐）
 */
export function ExerciseRecordModal({
  exercise,
  isOpen,
  onClose,
}: ExerciseRecordModalProps) {
  // 種目が選択されていない場合は何も表示しない
  if (!exercise) {
    return null;
  }

  const isCardio = isCardioExercise(exercise);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl h-[90vh] flex flex-col p-0"
        showCloseButton={false}
      >
        {/* ヘッダー */}
        <DialogHeader className="flex-row items-center gap-4 px-6 pb-4 pt-6 border-b sticky top-0 bg-background z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="戻る"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <DialogTitle className="flex-1 text-xl font-bold">
            {exercise.name}
          </DialogTitle>
          {/* グラフ・設定ボタン（後で実装） */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // TODO: グラフ表示機能（後で実装）
              console.log("グラフ表示");
            }}
            className="h-8 w-8"
            aria-label="グラフ表示"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // TODO: 設定機能（後で実装）
              console.log("設定");
            }}
            className="h-8 w-8"
            aria-label="設定"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* 前回記録セクション（後で実装） */}
          {/* TODO: 前回記録を表示（フェーズ2で実装） */}

          {/* セパレーター */}
          {/* TODO: 前回記録セクション実装後に追加 */}

          {/* 今日の記録セクション（後で実装） */}
          {/* TODO: セット記録エリアを実装（ステップ8で実装予定）
            - 筋トレ種目: 重量 × 回数（セットごと）
            - 有酸素種目: 時速、距離、時間、消費カロリーなど
            - isCardioフラグに基づいて別コンポーネントを表示
          */}
          <div className="text-center text-muted-foreground py-8">
            {isCardio ? (
              <div>
                <p>有酸素種目の記録機能は準備中です</p>
                <p className="text-xs mt-2">
                  （時速、速度、消費カロリー、距離、時間などの入力）
                </p>
              </div>
            ) : (
              <p>セット記録機能は準備中です</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
