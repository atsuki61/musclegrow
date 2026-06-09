"use client";

/**
 * 記録画面（ページ全体の組み立て専用）
 *
 * 責務: 日付・部位・検索などの UI state を持ち、各 hook の結果を JSX に渡すだけ
 * ロジックの置き場:
 *   - 種目 CRUD / guest-login 分岐 → hooks/use-record-exercises.ts
 *   - 前回記録キャッシュ       → hooks/use-previous-record-cache.ts
 *   - スワイプ操作             → hooks/use-body-part-swipe.ts
 *   - セット保存               → hooks/use-workout-session.ts（モーダル内）
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parse } from "date-fns";
import { Search, Pencil, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DateSelector } from "./date-selector";
import { BodyPartNavigation } from "./body-part-navigation";
import { BodyPartCard } from "./body-part-card";
import ExerciseRecordModal from "./exercise-record-modal";
import { AddExerciseModal } from "./add-exercise-modal";
import { RenameCustomExerciseDialog } from "./rename-custom-exercise-dialog";
import { useBodyPartSwipe } from "./hooks/use-body-part-swipe";
import { usePreviousRecordCache } from "./hooks/use-previous-record-cache";
import { useRecordExercises } from "./hooks/use-record-exercises";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMaxWeights } from "@/hooks/use-max-weights";
import { useLastTrainedDates } from "@/hooks/use-last-trained";
import { useAuthSession } from "@/lib/auth-session-context";
import type { BodyPart, Exercise } from "@/types/workout";
import { getExerciseTargetMuscleLabels } from "@/lib/exercise-mappings";

interface RecordPageProps {
  initialExercises?: Exercise[];
}

/** URL の ?date=yyyy-MM-dd を読む。無効なら今日の日付。マウント時に1回だけ使う。 */
const parseDateFromSearchParams = (searchParams: URLSearchParams): Date => {
  const dateParam = searchParams.get("date");
  if (dateParam) {
    try {
      const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date());
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    } catch (error) {
      console.warn("無効な日付パラメータ:", dateParam, error);
    }
  }
  return new Date();
};

export default function RecordPage({ initialExercises = [] }: RecordPageProps) {
  const searchParams = useSearchParams();
  const { userId } = useAuthSession();

  // --- 画面の基本 state（日付・部位・検索・編集モード） ---
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    parseDateFromSearchParams(searchParams)
  );
  const [selectedPart, setSelectedPart] =
    useState<Exclude<BodyPart, "all">>("chest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // --- モーダル開閉 state（記録入力 / 種目追加） ---
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  ); // 記録モーダルで編集中の種目
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [addExerciseBodyPart, setAddExerciseBodyPart] =
    useState<Exclude<BodyPart, "all">>("chest"); // 追加モーダルの初期タブ

  // --- 種目カードに表示する MAX 重量・最終トレ日 ---
  const { maxWeights, recalculateMaxWeights } = useMaxWeights();
  const { refresh: refreshLastTrained } = useLastTrainedDates();

  const recalculateStats = useCallback(() => {
    recalculateMaxWeights();
    refreshLastTrained();
  }, [recalculateMaxWeights, refreshLastTrained]);

  // 最大重量と最終トレーニング日の集計状態を記録画面の表示と同期する。
  useEffect(() => {
    recalculateStats();
  }, [recalculateStats]);

  // --- 種目リスト CRUD（guest/login 分岐は hook 内） ---
  const {
    exercises, // 記録画面に表示する種目一覧
    handleAddExercise, // 種目追加モーダルから呼ぶ
    handleCloseRenameCustomExercise,
    handleDeleteCustomExercise,
    handleOpenRenameCustomExercise,
    handleRemoveExercise, // 編集モードでタップ → 非表示 or カスタム削除
    handleRenameCustomExercise,
    handleRenameExerciseNameChange,
    isCustomExerciseOwnedByCurrentUser, // リネーム・削除ボタンの表示判定
    renameExerciseError,
    renameExerciseName,
    renamingExercise, // null なら RenameDialog は閉じている
  } = useRecordExercises({
    initialExercises,
    onExerciseListChanged: recalculateStats,
    userId,
  });

  const filteredExercises = useMemo(() => {
    // 表示対象の部位に絞ったあと、種目名・対象筋・補助分類で検索する。
    let result = exercises.filter((e) => e.bodyPart === selectedPart);

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(lowerQuery) ||
          getExerciseTargetMuscleLabels(e).some((label) =>
            label.toLowerCase().includes(lowerQuery)
          ) ||
          (e.muscleSubGroup &&
            e.muscleSubGroup.toLowerCase().includes(lowerQuery))
      );
    }
    return result;
  }, [exercises, selectedPart, searchQuery]);

  const handleDateChange = (date: Date) => setSelectedDate(date);

  const handlePartChange = useCallback((part: BodyPart) => {
    if (part === "all") return;
    // 部位を変えたら、前の部位で使っていた検索と編集状態は持ち越さない。
    setSelectedPart(part);
    setSearchQuery("");
    setIsEditMode(false);
  }, []);

  // --- 左右スワイプで部位切替 ---
  const {
    handleDragEnd,
    resetSwipeDirection, // AnimatePresence の exit 完了後に方向を 0 に戻す
    showSwipeHint, // 初回のみ「スワイプで部位切替」バナー
    swipeDirection, // 1=左へ / -1=右へ / 0=タブ操作（アニメ方向用）
  } = useBodyPartSwipe({
    selectedPart,
    onPartChange: handlePartChange,
  });

  // --- 記録モーダルに渡す前回記録 ---
  const {
    clearPreviousRecordLoadingForExercise, // 種目タップ時: 前回 stuck した loading を掃除
    clearSelectedPreviousRecordLoading, // モーダル閉じ時: 進行中 loading を掃除
    isPreviousRecordLoading, // 「前回記録を読み込み中...」表示用
    loadPreviousRecordForExercise, // 種目タップ時に1回呼ぶ
    previousRecord, // null = 前回記録なし
  } = usePreviousRecordCache({
    selectedDate,
    selectedExercise,
    userId,
  });

  // --- ユーザー操作ハンドラ ---
  const handleExerciseSelect = (exercise: Exercise) => {
    if (isEditMode) {
      // 編集モード中のタップは記録入力ではなく、リスト整理操作として扱う。
      void handleRemoveExercise(exercise);
      return;
    }
    clearPreviousRecordLoadingForExercise(exercise);
    setSelectedExercise(exercise);
    setIsModalOpen(true);
    void loadPreviousRecordForExercise(exercise);
  };

  const handleModalClose = () => {
    clearSelectedPreviousRecordLoading();
    setIsModalOpen(false);
    setSelectedExercise(null);
    recalculateStats();
  };

  const handleAddExerciseClick = () => {
    setAddExerciseBodyPart(selectedPart);
    setIsAddExerciseModalOpen(true);
    setIsEditMode(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* 日付と部位ナビゲーションは、スクロールしても操作しやすいよう固定表示する。 */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
        <div className="flex h-14 items-center justify-center px-4">
          <DateSelector date={selectedDate} onDateChange={handleDateChange} />
        </div>
        <div className="px-2 pb-1">
          <BodyPartNavigation
            selectedPart={selectedPart}
            onPartChange={handlePartChange}
          />
        </div>

        <AnimatePresence>
          {showSwipeHint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-primary/10 text-primary text-xs px-4 py-2 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="h-4 w-4 animate-pulse" />
              <span>スワイプで部位切替</span>
              <ChevronRight className="h-4 w-4 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 検索と編集操作はスワイプ対象外にして、種目一覧だけを左右切り替えする。 */}
      <main className="flex-1 flex w-full max-w-[430px] flex-col mx-auto px-4 py-4 gap-4 overflow-hidden">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="種目を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/40 border-border/50 rounded-xl focus-visible:ring-primary/50"
            />
          </div>

          <Button
            variant={isEditMode ? "default" : "outline"}
            size="icon"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`rounded-xl transition-all ${
              isEditMode
                ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                : "border-border/50 text-muted-foreground"
            }`}
            title="種目を整理"
          >
            {isEditMode ? (
              <Check className="h-5 w-5" />
            ) : (
              <Pencil className="h-5 w-5" />
            )}
          </Button>
        </div>

        {isEditMode && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-lg flex items-center justify-center animate-in fade-in slide-in-from-top-2">
            <span className="font-bold">編集モード:</span>{" "}
            タップしてリストから非表示にします
          </div>
        )}

        <AnimatePresence
          mode="wait"
          custom={swipeDirection}
          onExitComplete={resetSwipeDirection}
        >
          <motion.div
            key={selectedPart}
            custom={swipeDirection}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            variants={{
              initial: (direction: number) => ({
                x: direction > 0 ? 200 : direction < 0 ? -200 : 0,
                opacity: 0,
              }),
              animate: {
                x: 0,
                opacity: 1,
              },
              exit: (direction: number) => ({
                x: direction > 0 ? -200 : direction < 0 ? 200 : 0,
                opacity: 0,
              }),
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 35,
            }}
            className="touch-pan-y flex-1 min-h-0"
          >
            <BodyPartCard
              bodyPart={selectedPart}
              exercises={filteredExercises}
              maxWeights={maxWeights}
              onExerciseSelect={handleExerciseSelect}
              onAddExerciseClick={handleAddExerciseClick}
              onRenameCustomExercise={handleOpenRenameCustomExercise}
              isCustomExercise={isCustomExerciseOwnedByCurrentUser}
              isEditMode={isEditMode}
              selectedDate={selectedDate}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* --- モーダル群 --- */}
      <ExerciseRecordModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        date={selectedDate}
        previousRecord={previousRecord}
        isPreviousRecordLoading={isPreviousRecordLoading}
      />
      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        onAddExercise={handleAddExercise}
        onDeleteCustomExercise={handleDeleteCustomExercise}
        onRenameCustomExercise={handleOpenRenameCustomExercise}
        isCustomExercise={isCustomExerciseOwnedByCurrentUser}
        allExercises={exercises}
        initialBodyPart={addExerciseBodyPart}
      />
      <RenameCustomExerciseDialog
        error={renameExerciseError}
        exercise={renamingExercise}
        name={renameExerciseName}
        onClose={handleCloseRenameCustomExercise}
        onNameChange={handleRenameExerciseNameChange}
        onSubmit={() => void handleRenameCustomExercise()}
      />
    </div>
  );
}
