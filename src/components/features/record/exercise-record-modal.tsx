"use client";

import { useEffect, useState, useMemo } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, BarChart3, Settings } from "lucide-react";
import { isCardioExercise, isTimeBasedExercise } from "@/lib/utils";
import { SetRecordForm } from "./set-record-form";
import { CardioRecordForm } from "./cardio-record-form";
import {
  PreviousWorkoutRecordCard,
  PreviousCardioRecordCard,
} from "./previous-record-card";
import {
  getPreviousWorkoutRecord,
  getPreviousCardioRecord,
} from "@/lib/previous-record";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
import { Separator } from "@/components/ui/separator";
import { useWorkoutSession } from "@/hooks/use-workout-session";
import { useCardioSession } from "@/hooks/use-cardio-session";
import {
  setRecordSchema,
  cardioRecordSchema,
  validateItems,
} from "@/lib/validations";

interface ExerciseRecordModalProps {
  /** 選択された種目 */
  exercise: Exercise | null;
  /** モーダルの開閉状態 */
  isOpen: boolean;
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
  /** 記録する日付 */
  date: Date;
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
  date,
}: ExerciseRecordModalProps) {
  // exerciseが存在する場合のみisCardioを計算
  const isCardio = exercise ? isCardioExercise(exercise) : false;

  // 前回記録の表示/非表示状態
  const [showPreviousRecord, setShowPreviousRecord] = useState(false);

  // 前回記録を取得
  const previousRecord = useMemo(() => {
    if (!exercise || !isOpen) return null;

    if (isCardio) {
      return getPreviousCardioRecord(date, exercise.id);
    } else {
      return getPreviousWorkoutRecord(date, exercise.id);
    }
  }, [exercise, date, isOpen, isCardio]);

  /**
   * 初期セットを作成する（筋トレ種目用）
   */
  const createInitialSet = (): SetRecord => {
    const isTimeBased = exercise ? isTimeBasedExercise(exercise) : false;

    return {
      id: nanoid(),
      setOrder: 1,
      // 重量は任意（自重種目は任意なのでundefinedで初期化）
      weight: undefined,
      reps: 0,
      // 時間ベース種目の場合のみdurationを設定
      duration: isTimeBased ? 0 : undefined,
      isWarmup: false,
      failure: false,
    };
  };

  /**
   * 初期記録を作成する（有酸素種目用）
   */
  const createInitialCardioRecord = (): CardioRecord => ({
    id: nanoid(),
    duration: 0,
    distance: null,
    speed: null,
    calories: null,
    heartRate: null,
    notes: null,
    date: new Date(),
  });

  // ローカルストレージを使用したセット記録管理（筋トレ種目用）
  const { sets, setSets, saveSets } = useWorkoutSession({
    date,
    exerciseId: exercise?.id || null,
    isOpen,
    // 筋トレ種目の場合のみ初期セットを作成
    createInitialSet: isCardio ? undefined : createInitialSet,
  });

  // ローカルストレージを使用した有酸素種目記録管理
  const { records, setRecords, saveRecords } = useCardioSession({
    date,
    exerciseId: exercise?.id || null,
    isOpen,
    // 有酸素種目の場合のみ初期記録を作成
    createInitialRecord: isCardio ? createInitialCardioRecord : undefined,
  });

  /**
   * モーダルを閉じる時の処理
   * セット記録または有酸素種目記録を自動保存（バリデーション付き）
   */
  const handleClose = async () => {
    if (!exercise) {
      setShowPreviousRecord(false);
      onClose();
      return;
    }

    if (isCardio) {
      // 有酸素種目の記録をバリデーションして保存
      if (records.length > 0) {
        // 有効な記録のみをフィルタリング（durationが0より大きい）
        const validRecords = records.filter((record) => record.duration > 0);

        if (validRecords.length > 0) {
          const invalidRecords = validateItems(
            validRecords,
            cardioRecordSchema,
            "有酸素記録"
          );

          if (invalidRecords.length === 0) {
            // 保存が完了するまで待機
            await saveRecords(validRecords);
          } else {
            console.warn(
              `有酸素記録の保存をスキップしました（エラー: ${invalidRecords.join(
                ", "
              )}）`
            );
          }
        }
      }
    } else {
      // 筋トレ種目のセット記録をバリデーションして保存
      if (sets.length > 0) {
        // 有効なセットのみをフィルタリング（重量、回数、時間のいずれかが0より大きい）
        const validSets = sets.filter(
          (set) =>
            (set.weight !== undefined &&
              set.weight !== null &&
              set.weight > 0) ||
            (set.reps !== undefined && set.reps !== null && set.reps > 0) ||
            (set.duration !== undefined &&
              set.duration !== null &&
              set.duration > 0)
        );

        if (validSets.length > 0) {
          const invalidSets = validateItems(
            validSets,
            setRecordSchema,
            "セット"
          );

          if (invalidSets.length === 0) {
            // 保存が完了するまで待機
            await saveSets(validSets);
          } else {
            console.warn(
              `セット記録の保存をスキップしました（エラー: ${invalidSets.join(
                ", "
              )}）`
            );
          }
        }
      }
    }

    // 前回記録の表示状態をリセット
    setShowPreviousRecord(false);
    onClose();
  };

  /**
   * 前回記録をコピーする
   */
  const handleCopyPreviousRecord = () => {
    if (!previousRecord) return;

    if (isCardio && "records" in previousRecord) {
      // 有酸素種目の場合
      setRecords(previousRecord.records);
    } else if (!isCardio && "sets" in previousRecord) {
      // 筋トレ種目の場合
      const copiedSets: SetRecord[] = previousRecord.sets.map((set) => ({
        ...set,
        id: nanoid(), // 新しいIDを生成
      }));
      setSets(copiedSets);
    }
  };

  /**
   * exerciseが変更されたときに前回記録の表示状態をリセット
   */
  useEffect(() => {
    if (exercise) {
      setShowPreviousRecord(false);
    }
  }, [exercise]);

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
            <DialogHeader className="px-6 pb-4 pt-6 border-b sticky top-0 bg-background z-10">
              <div className="flex-row items-center gap-4 flex">
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
              </div>
              <DialogDescription className="sr-only">
                {isCardio ? "有酸素種目の記録を入力します" : "筋トレ種目のセット記録を入力します"}
              </DialogDescription>
            </DialogHeader>

            {/* コンテンツエリア */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* 前回記録セクション */}
              {previousRecord && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowPreviousRecord(!showPreviousRecord)}
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    前回の記録を表示する
                  </button>
                  {showPreviousRecord && (
                    <>
                      {isCardio && "records" in previousRecord ? (
                        <PreviousCardioRecordCard
                          records={previousRecord.records}
                          date={previousRecord.date}
                          onCopy={handleCopyPreviousRecord}
                        />
                      ) : !isCardio && "sets" in previousRecord ? (
                        <PreviousWorkoutRecordCard
                          sets={previousRecord.sets}
                          date={previousRecord.date}
                          onCopy={handleCopyPreviousRecord}
                        />
                      ) : null}
                    </>
                  )}
                </div>
              )}

              {/* セパレーター */}
              <Separator className="bg-border/60" />

              {/* 今日の記録セクション */}
              {isCardio ? (
                // 有酸素種目の場合: 有酸素種目記録フォームを表示
                <CardioRecordForm
                  records={records}
                  onRecordsChange={setRecords}
                />
              ) : (
                // 筋トレ種目の場合: セット記録フォームを表示
                <SetRecordForm
                  exercise={exercise}
                  sets={sets}
                  onSetsChange={setSets}
                />
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
