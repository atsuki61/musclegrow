"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
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
import { X, History, Info, Dumbbell, Activity } from "lucide-react";
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

interface ExerciseRecordModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  date: Date;
}

export default function ExerciseRecordModal({
  exercise,
  isOpen,
  onClose,
  date,
}: ExerciseRecordModalProps) {
  const isCardio = exercise ? isCardioExercise(exercise) : false;
  const [activeTab, setActiveTab] = useState("record");

  const { record: previousRecord, isLoading: isPreviousLoading } =
    usePreviousRecord(date, exercise);

  // 初期セット作成ロジック
  const createInitialSet = (): SetRecord => {
    const isTimeBased = exercise ? isTimeBasedExercise(exercise) : false;
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

  const { sets, setSets, saveSets } = useWorkoutSession({
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

  const handleClose = () => {
    if (!exercise) {
      onClose();
      return;
    }

    if (isCardio) {
      const validRecords = records.filter((record) => record.duration > 0);
      if (validRecords.length > 0) {
        const invalidRecords = validateItems(
          validRecords,
          cardioRecordSchema,
          "有酸素記録"
        );
        if (invalidRecords.length === 0) {
          saveRecords(validRecords).catch(console.error);
        }
      }
    } else {
      const validSets = sets.filter(
        (set) =>
          (set.weight && set.weight > 0) ||
          (set.reps && set.reps > 0) ||
          (set.duration && set.duration > 0)
      );
      if (validSets.length > 0) {
        const invalidSets = validateItems(validSets, setRecordSchema, "セット");
        if (invalidSets.length === 0) {
          saveSets(validSets).catch(console.error);
        }
      }
    }
    setActiveTab("record");
    onClose();
  };

  const handleCopyPreviousRecord = () => {
    if (!previousRecord) return;

    if (previousRecord.type === "cardio") {
      setRecords(previousRecord.records);
    } else if (previousRecord.type === "workout") {
      const copiedSets: SetRecord[] = previousRecord.sets.map((set) => ({
        ...set,
        id: nanoid(),
      }));
      setSets(copiedSets);
    }
  };

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {/* h-[85vh] -> h-[90dvh] に変更し、スマホのアドレスバー考慮 */}
      <DialogContent className="w-full max-w-lg h-[95dvh] sm:h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-0 sm:border">
        {/* 1. ヘッダーエリア */}
        <div className="bg-background border-b px-4 py-3 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="shrink-0 -mr-2 h-9 w-9 rounded-full hover:bg-muted active:scale-90 transition-transform"
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
          {/* ScrollAreaのコンテナ設定を修正してスクロール可能に */}
          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full w-full">
              <div className="p-4 pb-4">
                <TabsContent value="record" className="mt-0 space-y-4">
                  {/* 前回記録 */}
                  {isPreviousLoading ? (
                    <div className="bg-muted/20 rounded-xl p-3 text-center text-xs text-muted-foreground">
                      前回記録を読み込み中...
                    </div>
                  ) : previousRecord ? (
                    <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/20 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          <History className="w-3 h-3" />
                          前回の記録 (
                          {new Date(previousRecord.date).toLocaleDateString()})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyPreviousRecord}
                          className="h-6 text-[10px] px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                        >
                          コピーする
                        </Button>
                      </div>
                      <div className="opacity-80">
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
                    />
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-0 py-8 text-center">
                  <History className="w-10 h-10 opacity-20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    過去の履歴機能は準備中です
                  </p>
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
              className="w-full h-11 text-base font-bold shadow-md shadow-primary/20 rounded-xl active:scale-[0.98] transition-all"
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
