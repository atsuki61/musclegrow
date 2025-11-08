"use client";

import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, BarChart3, Settings } from "lucide-react";
import { isCardioExercise } from "@/lib/utils";
import { SetRecordForm } from "./set-record-form";
import type { Exercise, SetRecord } from "@/types/workout";
import { Separator } from "@/components/ui/separator";

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
  // セット記録の状態管理（筋トレ種目の場合のみ）
  const [sets, setSets] = useState<SetRecord[]>([]);
  // 前回のexercise.idを追跡するref（exercise変更時のリセット用）
  const previousExerciseIdRef = useRef<string | null>(null);

  // exerciseが存在する場合のみisCardioを計算
  const isCardio = exercise ? isCardioExercise(exercise) : false;

  /**
   * 初期セットを作成する
   */
  const createInitialSet = (): SetRecord => ({
    id: nanoid(),
    setOrder: 1,
    weight: 0,
    reps: 0,
    isWarmup: false,
    failure: false,
  });

  /**
   * モーダルが閉じられたときにセットをリセット
   */
  useEffect(() => {
    if (!isOpen) {
      setSets([]);
      previousExerciseIdRef.current = null;
    }
  }, [isOpen]);

  /**
   * exerciseが変更されたとき、またはモーダルが開いたときに初期セットを追加（筋トレ種目の場合のみ）
   */
  useEffect(() => {
    if (!isOpen || !exercise || isCardio) {
      return;
    }

    // exerciseが変更された場合はリセットして初期セットを追加
    if (previousExerciseIdRef.current !== exercise.id) {
      previousExerciseIdRef.current = exercise.id;
      setSets([createInitialSet()]);
    }
  }, [isOpen, exercise, isCardio]);

  /**
   * モーダルを閉じる時の処理
   */
  const handleClose = () => {
    onClose();
  };

  // exerciseがnullの場合はDialogを表示しない（早期リターンではなく、openプロップで制御）
  return (
    <Dialog open={isOpen && !!exercise} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl h-[90vh] flex flex-col p-0"
        showCloseButton={false}
      >
        {/* exerciseが存在する場合のみコンテンツを表示 */}
        {exercise && (
          <>
            {/* ヘッダー */}
            <DialogHeader className="flex-row items-center gap-4 px-6 pb-4 pt-6 border-b sticky top-0 bg-background z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
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
              <Separator className="bg-border/60" />

              {/* 今日の記録セクション */}
              {isCardio ? (
                // 有酸素種目の場合（後で実装）
                <div className="text-center text-muted-foreground py-8">
                  <p>有酸素種目の記録機能は準備中です</p>
                  <p className="text-xs mt-2">
                    （時速、速度、消費カロリー、距離、時間などの入力）
                  </p>
                </div>
              ) : (
                // 筋トレ種目の場合: セット記録フォームを表示
                <SetRecordForm sets={sets} onSetsChange={setSets} />
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
