"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { parse } from "date-fns";
import { Search, Pencil, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { DateSelector } from "./date-selector";
import { BodyPartNavigation } from "./body-part-navigation";
import { BodyPartCard } from "./body-part-card";
import ExerciseRecordModal from "./exercise-record-modal";
import { AddExerciseModal } from "./add-exercise-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveExercise } from "@/lib/api";
import { useMaxWeights } from "@/hooks/use-max-weights";
import { useLastTrainedDates } from "@/hooks/use-last-trained";
import { usePreviousRecord } from "@/hooks/use-previous-record";
import { useAuthSession } from "@/lib/auth-session-context";
import type { BodyPart, Exercise } from "@/types/workout";
import { toast } from "sonner";
import {
  toggleExerciseVisibility,
} from "@/lib/actions/user-exercises";
import {
  getGuestExercises,
  toggleGuestExerciseVisibility,
  saveGuestCustomExercise,
} from "@/lib/local-storage-guest";

/**
 * スワイプ可能な部位の順番リスト
 * この順番で左右スワイプ時に切り替わる
 */
const BODY_PARTS_ORDER: Exclude<BodyPart, "all">[] = [// 定数定義

  "chest",     // 胸
  "back",      // 背中
  "legs",      // 脚
  "shoulders", // 肩
  "arms",      // 腕
  "core",      // 腹筋
  "other",     // その他
];

/**
 * スワイプを認識するための最小移動距離（ピクセル）
 * この値より小さい移動は誤操作として無視される
 */
const SWIPE_THRESHOLD = 50;

/**
 * スワイプヒントの表示状態を管理するlocalStorageキー
 * 一度表示したら再表示しない
 */
const SWIPE_HINT_SHOWN_KEY = "record_swipe_hint_shown";

interface RecordPageProps {
  initialExercises?: Exercise[];
}

export default function RecordPage({ initialExercises = [] }: RecordPageProps) {
  const searchParams = useSearchParams();
  const { userId } = useAuthSession();

  // --- データ取得ロジック ---
  const getInitialDate = (): Date => {
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

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());
  const [selectedPart, setSelectedPart] =
    useState<Exclude<BodyPart, "all">>("chest");
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // ========================================
  // スワイプアニメーション用のState
  // ========================================

  /**
   * スワイプ方向を追跡するState
   * - 正の値（1）: 右から左へスワイプ → 次の部位へ
   * - 負の値（-1）: 左から右へスワイプ → 前の部位へ
   * - 0: 初期状態（アニメーションなし）
   */
  const [swipeDirection, setSwipeDirection] = useState(0);

//スワイプが可能であることを示す
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // Modals & Selection
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [addExerciseBodyPart, setAddExerciseBodyPart] =
    useState<Exclude<BodyPart, "all">>("chest");

  const { maxWeights, recalculateMaxWeights } = useMaxWeights();
  const { refresh: refreshLastTrained } = useLastTrainedDates();

  const { record: prefetchedRecord } = usePreviousRecord(
    selectedDate,
    selectedExercise
  );

  //データ読み込みロジック (ゲスト対応)
useEffect(() => {
  // ログインユーザーの場合、サーバーから既に設定反映済みなので再取得不要
  if (userId) {
    return;
  }
  
  // ゲストユーザーのみ: ローカルストレージとマージ
  const guestExercises = getGuestExercises(initialExercises);
  setExercises(guestExercises);
}, [userId, initialExercises]);

  const recalculateStats = useCallback(() => {
    recalculateMaxWeights();
    refreshLastTrained();
  }, [recalculateMaxWeights, refreshLastTrained]);

  useEffect(() => {
    recalculateStats();
  }, [recalculateStats]);

  // ② swipeDirection の初期化
  // アニメーション完了後にリセット（AnimatePresence の onExitComplete を使用）
  // これにより、アニメーション中に swipeDirection が 0 にリセットされることを防ぐ

  // ③ スワイプヒントの初回表示
  useEffect(() => {
    // SSR時はスキップ（localStorageにアクセスできない）
    if (typeof window === "undefined") return;
    // 既に表示済みならスキップ
    const hasSeenHint = localStorage.getItem(SWIPE_HINT_SHOWN_KEY);
    if (hasSeenHint) return;
    setShowSwipeHint(true);// 初回表示
    // 3秒後に自動で閉じて、表示済みフラグを保存
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
      localStorage.setItem(SWIPE_HINT_SHOWN_KEY, "true");
    }, 3000);

    // クリーンアップ（コンポーネントがアンマウントされた場合）
    return () => clearTimeout(timer);
  }, []);

  const filteredExercises = useMemo(() => {
    // 選択中の部位でフィルタ
    let result = exercises.filter((e) => e.bodyPart === selectedPart);

    // 検索クエリが入力されている場合、名前またはサブグループに部分一致
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(lowerQuery) ||
          (e.muscleSubGroup &&
            e.muscleSubGroup.toLowerCase().includes(lowerQuery))
      );
    }
    return result;
  }, [exercises, selectedPart, searchQuery]);

  const handleDateChange = (date: Date) => setSelectedDate(date);

  /**
   * 部位変更ハンドラ（ボタンタップ時）
   * 検索クエリと編集モードをリセットする
   */
  const handlePartChange = (part: BodyPart) => {
    if (part === "all") return;
    setSelectedPart(part);
    setSearchQuery("");
    setIsEditMode(false);
  };


  /**
   * スワイプ終了時のハンドラ
   *
   * @param _event - マウス/タッチイベント（今回は使用しない）
   * @param info - ドラッグ情報（移動量、速度などを含む）
   *
   * 【処理の流れ】
   * 1. 水平方向の移動量（offset.x）を取得
   * 2. 移動量が閾値を超えているかチェック
   * 3. 超えていれば、次or前の部位に切り替え
   */
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // offset.x: ドラッグ開始位置からの水平移動量
    // 負の値 = 左方向へドラッグ、正の値 = 右方向へドラッグ
    const offsetX = info.offset.x;

    // 現在選択中の部位のインデックスを取得
    const currentIndex = BODY_PARTS_ORDER.indexOf(selectedPart);

    if (offsetX < -SWIPE_THRESHOLD) {
      // 左スワイプ → 次の部位へ移動
      const nextIndex = currentIndex + 1;

      // 配列の範囲外にならないようにチェック
      if (nextIndex < BODY_PARTS_ORDER.length) {
        setSwipeDirection(1); // 右から左へのアニメーション
        handlePartChange(BODY_PARTS_ORDER[nextIndex]);
      }
    } else if (offsetX > SWIPE_THRESHOLD) {
      // 右スワイプ → 前の部位へ移動
      const prevIndex = currentIndex - 1;// 例: 背中(1) → 胸(0)
      // 配列の範囲外にならないようにチェック
      if (prevIndex >= 0) {
        setSwipeDirection(-1); // 左から右へのアニメーション
        handlePartChange(BODY_PARTS_ORDER[prevIndex]);
      }
    }
    // 閾値未満の場合は何もしない（誤操作防止）
  };
  // 種目選択ハンドラ
  const handleExerciseSelect = (exercise: Exercise) => {
    if (isEditMode) {//もし編集モードが有効なら
      handleRemoveExercise(exercise);//種目を削除
      return;
    }
    setSelectedExercise(exercise);//種目を選択
    setIsModalOpen(true);//モーダルを開く
  };
  // モーダルを閉じるハンドラ
  const handleModalClose = () => {
    setIsModalOpen(false);//モーダルを閉じる
    setSelectedExercise(null);//種目を選択解除
    recalculateStats();//統計を再計算
  };
//
  // 種目追加ボタンクリックハンドラ
  const handleAddExerciseClick = () => {
    setAddExerciseBodyPart(selectedPart);//部位を選択
    setIsAddExerciseModalOpen(true);//モーダルを開く
    setIsEditMode(false);//編集モードを無効化
  };

  // ゲスト対応
  const handleAddExercise = async (exercise: Exercise) => {
    if (userId) {// ログイン時
      // カスタム種目の場合は、まずexercisesテーブルに保存する
      if (exercise.tier === "custom") {
        const result = await saveExercise(userId, exercise);
        if (!result.success) {
          console.error("種目保存エラー:", result.error);
          toast.error("種目の保存に失敗しました");
          return; // エラー時は処理を中断
        }
      }
      //種目が存在することを確認してから、表示設定を保存
      await toggleExerciseVisibility(userId, exercise.id, true);
    } else {
      // ゲスト時
      toggleGuestExerciseVisibility(exercise.id, true);
      if (exercise.tier === "custom") {
        saveGuestCustomExercise(exercise);
      }
    }
    //新しい種目を作成
    const newExercise = { ...exercise, tier: "initial" as const };
    setExercises((prev) => {//種目リストを更新
      const exists = prev.some((e) => e.id === exercise.id);
      if (exists) {//もし種目が存在する場合
        return prev.map((e) => (e.id === exercise.id ? newExercise : e));
      }
      return [...prev, newExercise];//種目リストに新しい種目を追加
    });

    recalculateStats();//統計を再計算
    toast.success("種目をリストに追加しました");
  };

  // 削除ロジック (ゲスト対応)
  const handleRemoveExercise = async (exercise: Exercise) => {
    if (userId) {
      // ログイン時
      await toggleExerciseVisibility(userId, exercise.id, false);
    } else {
      // ▼ ゲスト時
      toggleGuestExerciseVisibility(exercise.id, false);
    }

    setExercises((prev) =>
      prev.map((e) => (e.id === exercise.id ? { ...e, tier: "selectable" } : e))
    );
    toast.success("リストから削除しました", {
      description: "種目追加画面からいつでも元に戻せます",
    });
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* Header */}
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

        {/* ③ スワイプヒント（初回のみ表示） */}
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

      {/* Main Content - スワイプ対応エリア */}
      <main className="flex-1 container mx-auto px-4 py-4 space-y-4 overflow-hidden">
        {/* 検索バーと編集ボタン（スワイプ対象外） */}
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

        {/*
          ========================================
          スワイプ対応の種目リストエリア
          ========================================

          【AnimatePresence】
          - 子要素が切り替わる時にアニメーションを適用する
          - mode="wait": 現在の要素が完全に消えてから次の要素を表示
          - custom={swipeDirection}: アニメーションに方向を渡す

          【motion.div】
          - スワイプ（ドラッグ）操作を検知する
          - drag="x": 水平方向のみドラッグ可能
          - dragConstraints: ドラッグ可能な範囲を制限
          - onDragEnd: ドラッグ終了時の処理

          【key={selectedPart}】
          - 部位が変わるとコンポーネントが再マウントされる
          - これによりアニメーションがトリガーされる

          【variants】
          - アニメーションの各状態（初期・表示中・退出）を定義
          - custom値（swipeDirection）を使って動的に方向を変える
        */}
        <AnimatePresence
          mode="wait"
          custom={swipeDirection}
          // アニメーション完了後に swipeDirection をリセット
          // これにより、次のアニメーションが正しく動作する
          onExitComplete={() => {
            setSwipeDirection(0);
          }}
        >
          <motion.div
            key={selectedPart}
            custom={swipeDirection}
            // ドラッグ設定
            drag="x"
            dragConstraints={{ left: 0, right: 0 }} // ドラッグ後は元の位置に戻る
            dragElastic={0.2} // ドラッグの弾力性（0-1、小さいほど硬い）
            onDragEnd={handleDragEnd}
            // アニメーション設定（variants を使用）
            variants={{
              // 初期状態: 画面外から登場
              // direction > 0: 次の部位へ（右から左へスワイプ）→ 右から登場（x: 200）
              // direction < 0: 前の部位へ（左から右へスワイプ）→ 左から登場（x: -200）
              initial: (direction: number) => ({
                x: direction > 0 ? 200 : direction < 0 ? -200 : 0,
                opacity: 0,
              }),
              // 表示中: 中央に配置
              animate: {
                x: 0,
                opacity: 1,
              },
              // 退出時: 画面外へ移動
              // direction > 0: 次の部位へ → 現在の画面は左へ消える（x: -200）
              // direction < 0: 前の部位へ → 現在の画面は右へ消える（x: 200）
              exit: (direction: number) => ({
                x: direction > 0 ? -200 : direction < 0 ? 200 : 0,
                opacity: 0,
              }),
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              // アニメーションの動き方
              type: "spring",  // バネのような自然な動き
              stiffness: 600,  // バネの硬さ（大きいほど速い）-
              damping: 35,     // 減衰（大きいほど揺れが少ない）-
            }}
            // スタイル
            className="touch-pan-y" // 縦スクロールは許可する
          >
            {/* 部位カード */}
            <BodyPartCard
              bodyPart={selectedPart}
              exercises={filteredExercises}
              maxWeights={maxWeights}
              onExerciseSelect={handleExerciseSelect}
              onAddExerciseClick={handleAddExerciseClick}
              isEditMode={isEditMode}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 種目詳細モーダル */}
      <ExerciseRecordModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        date={selectedDate}
        prefetchedPreviousRecord={prefetchedRecord}
      />
      {/* 種目追加モーダル */}
      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        onAddExercise={handleAddExercise}
        allExercises={exercises}
        initialBodyPart={addExerciseBodyPart}
      />
    </div>
  );
}
