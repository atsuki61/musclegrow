"use client";

import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { HistoryTabContent } from "./history-tab-content";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  History,
  Info,
  Dumbbell,
  Activity,
  Timer as TimerIcon,
} from "lucide-react";
import { isCardioExercise, isTimeBasedExercise } from "@/lib/utils";
import { SetRecordForm } from "./set-record-form";
import { CardioRecordForm } from "./cardio-record-form";
import {
  PreviousWorkoutRecordCard,
  PreviousCardioRecordCard,
} from "./previous-record-card";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
import { useWorkoutSession } from "@/hooks/use-workout-session";
import { useCardioSession } from "@/hooks/use-cardio-session";
import { usePreviousRecord } from "@/hooks/use-previous-record";
import {
  setRecordSchema,
  cardioRecordSchema,
  validateItems,
} from "@/lib/validations";
import { useTimer } from "@/lib/timer-context";

function isValidSet(set: SetRecord): boolean {
  const hasReps = set.reps > 0;
  const hasDuration = (set.duration ?? 0) > 0;
  return hasReps || hasDuration;
}

// 前回記録コピー時も含め、セット数は上限を統一
const MAX_SETS = 50;

// 「最後の行が埋まっているなら、続き入力用に空行を足す」判定に使う
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

type PreviousRecordData =
  | { type: "workout"; sets: SetRecord[]; date: Date }
  | { type: "cardio"; records: CardioRecord[]; date: Date }
  | null;

interface ExerciseRecordModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  prefetchedPreviousRecord?: PreviousRecordData;
}

export default function ExerciseRecordModal({
  exercise,
  isOpen,
  onClose,
  date,
  prefetchedPreviousRecord,
}: ExerciseRecordModalProps) {
  // ▼ タイマー機能を取得
  const { startTimer } = useTimer();

  const isCardio = exercise ? isCardioExercise(exercise) : false;//exerciseがnullの場合はfalseを返す
  const [activeTab, setActiveTab] = useState("record");//タブをrecordに設定

  const { record: fetchedPreviousRecord, isLoading: isPreviousLoading } =
    usePreviousRecord(date, exercise);//前回記録を取得

  const previousRecord = fetchedPreviousRecord || prefetchedPreviousRecord;//前回記録を取得
  const isLoading = isPreviousLoading && !prefetchedPreviousRecord;//前回記録を取得中かどうか

  const createInitialSet = (): SetRecord => {//セットを作成
    const isTimeBased = exercise ? isTimeBasedExercise(exercise) : false;//exerciseがnullの場合はfalseを返す
    return {
      id: nanoid(),
      setOrder: 1,
      weight: undefined,
      reps: 0,
      duration: isTimeBased ? 0 : undefined,
      isWarmup: false,
      failure: false,
    };
  };

  const createInitialCardioRecord = (): CardioRecord => ({//有酸素記録を作成
    id: nanoid(),
    duration: 0,
    distance: null,
    speed: null,
    calories: null,
    heartRate: null,
    notes: null,
    date: new Date(),
  });

  const {//セットを取得
    sets,
    setSets,
    saveSets,
    isLoaded,
    isLoading: isSetsLoading,
  } = useWorkoutSession({
    date,
    exerciseId: exercise?.id || null,
    isOpen,
    createInitialSet: isCardio ? undefined : createInitialSet,
  });

  const { records, setRecords, saveRecords } = useCardioSession({
    date,
    exerciseId: exercise?.id || null,
    isOpen,
    createInitialRecord: isCardio ? createInitialCardioRecord : undefined,
  });

  // 初回ロード時に3セット作成を実行したかどうかを追跡するフラグ
  const hasInitializedRef = useRef(false);
  const previousExerciseIdRef = useRef<string | null>(null);

  useEffect(() => {
    // モーダルが閉じられたらフラグをリセット
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }

    // 種目が変更されたらフラグをリセット
    if (previousExerciseIdRef.current !== exercise?.id) {
      hasInitializedRef.current = false;
      previousExerciseIdRef.current = exercise?.id || null;
    }
  }, [isOpen, isLoaded, sets.length, exercise?.id]);

  // モーダルを閉じる
  const handleClose = () => {
    if (!exercise) {
      onClose();
      return;
    }

    // 有酸素記録の場合
    if (isCardio) {
      const validRecords = records.filter((record) => record.duration > 0);
      if (validRecords.length > 0) {
        //有酸素記録が存在する場合
        const invalidRecords = validateItems(
          validRecords,
          cardioRecordSchema,
          "有酸素記録"
        );
        if (invalidRecords.length === 0) {
          //有酸素記録が有効な場合
          saveRecords(validRecords).catch(console.error); //有酸素記録を保存
        }
      }
    } else {
      const validSets = sets.filter(isValidSet); //有効なセットを取得
      // 有効なセットがない場合は、既存のセット記録を削除して終了
      if (validSets.length > 0) {
        //有効なセットが存在する場合
        const invalidSets = validateItems(validSets, setRecordSchema, "セット"); //セットをバリデーション
        if (invalidSets.length === 0) {
          //セットが有効な場合
          saveSets(validSets).catch(console.error); //セットを保存
        }
      }
    }
    setActiveTab("record"); //タブを記録に切り替え
    onClose();
  };

  // 前回記録をコピー
  const handleCopyPreviousRecord = () => {
    if (!previousRecord) return; //前回記録が存在しない場合は終了
    // 前回記録の種類に応じて、前回記録をコピー
    if (previousRecord.type === "cardio") {
      setRecords(previousRecord.records);
    } else if (previousRecord.type === "workout") {
      //有酸素記録でない場合
      const copiedSets: SetRecord[] = previousRecord.sets.map((set) => ({
        ...set,
        id: nanoid(),
      }));
// コピーした最後のセットが値を持ち、セット数が最大(50)未満なら「続きを入力するための空セット」を追加する
      const shouldAppendEmptySet =
        copiedSets.length > 0 && // 前回セットが1件以上ある
        copiedSets.length < MAX_SETS && // 最大セット数に達していない
        hasAnyPositiveInputValue(copiedSets[copiedSets.length - 1]); // 最後のセットに値が入っている

      // 空セットを追加する条件を満たさない場合は、そのままセットを反映して終了
      if (!shouldAppendEmptySet) {
        setSets(copiedSets);
        return;
      }

      // 前回記録の “続き” をすぐ入力できるよう、末尾に空のセット行を 1 行だけ追加
      const maxSetOrder = copiedSets.reduce(
        (max, set) => Math.max(max, set.setOrder),
        0
      );
//
      setSets([
        ...copiedSets,
        {
          ...createInitialSet(),
          setOrder: maxSetOrder + 1,
        },
      ]);
    }
  };
  // 種目が存在しない場合は終了
  if (!exercise) return null;

  // タイマーカード内のクリックでモーダルが閉じないようにするハンドラー
  const handleInteractOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    // タイマーカード内のクリックは無視
    if (target.closest('[data-interval-timer="true"]')) {
      //タイマーカード内のクリックは無視
      event.preventDefault(); //クリックを無視
    }
  };
  // モーダルのコンポーネントを返す
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-lg h-[95dvh] sm:h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-0 sm:border"
        onInteractOutside={handleInteractOutside}
      >
        {/* 1. ヘッダーエリア */}
        <div className="bg-background border-b px-4 py-3 flex items-center justify-center shrink-0 z-10 shadow-sm relative">
          <div className="flex flex-col items-center gap-0.5 overflow-hidden">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-bold truncate leading-tight">
                {exercise.name}
              </DialogTitle>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 h-5 shrink-0 font-medium"
              >
                {exercise.bodyPart}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1">
              {isCardio ? (
                <Activity className="w-3 h-3" />
              ) : (
                <Dumbbell className="w-3 h-3" />
              )}
              {date.toLocaleDateString()} の記録
            </DialogDescription>
          </div>

          {/*タイマー起動ボタン*/}
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => startTimer(60)}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="タイマー開始 (60秒)"
            >
              <TimerIcon className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute right-2 h-9 w-9 rounded-full hover:bg-muted active:scale-90 transition-transform"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 2. タブ切り替え */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-4 py-2 border-b bg-muted/10 shrink-0">
            <TabsList className="grid w-full grid-cols-3 h-8 bg-muted/50 p-0.5">
              <TabsTrigger
                value="record"
                className="text-xs font-bold data-[state=active]:shadow-sm h-7"
              >
                記録
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="text-xs font-bold gap-1.5 data-[state=active]:shadow-sm h-7"
              >
                <History className="w-3 h-3" /> 履歴
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="text-xs font-bold gap-1.5 data-[state=active]:shadow-sm h-7"
              >
                <Info className="w-3 h-3" /> 解説
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 3. メインコンテンツ */}
          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full w-full">
              <div className="p-4 pb-4">
                <TabsContent value="record" className="mt-0 space-y-4">
                  {/* 前回記録 */}
                  {isLoading ? (
                    <div className="bg-muted/20 rounded-xl p-3 text-center text-xs text-muted-foreground">
                      前回記録を読み込み中...
                    </div>
                  ) : previousRecord ? (
                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <History className="w-3 h-3" />
                          前回の記録 (
                          {new Date(previousRecord.date).toLocaleDateString()})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyPreviousRecord}
                          className="h-6 text-[10px] px-2 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          コピーする
                        </Button>
                      </div>
                      <div className="text-foreground/90">
                        {previousRecord.type === "cardio" ? (
                          <PreviousCardioRecordCard
                            records={previousRecord.records}
                            date={previousRecord.date}
                            onCopy={() => {}}
                            hideHeader
                          />
                        ) : (
                          <PreviousWorkoutRecordCard
                            sets={previousRecord.sets}
                            date={previousRecord.date}
                            onCopy={() => {}}
                            hideHeader
                          />
                        )}
                      </div>
                    </div>
                  ) : null}

                  {isCardio ? (
                    <CardioRecordForm
                      records={records}
                      onRecordsChange={setRecords}
                    />
                  ) : (
                    <SetRecordForm
                      exercise={exercise}
                      sets={sets}
                      onSetsChange={setSets}
                      isLoading={isSetsLoading}
                    />
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <div className="p-4">
                    <HistoryTabContent exerciseId={exercise.id} />
                  </div>
                </TabsContent>

                <TabsContent value="info" className="mt-0 py-8 text-center">
                  <Info className="w-10 h-10 opacity-20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    解説機能は準備中です
                  </p>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>

          {/* 4. フッターアクション（固定） */}
          <div className="p-4 border-t bg-background shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <Button
              onClick={handleClose}
              className="w-full h-11 text-base font-bold shadow-md shadow-primary/20 rounded-xl active:scale-[0.98] transition-all bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              記録を完了する
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
