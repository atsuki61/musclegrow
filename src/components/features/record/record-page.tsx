"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { parse } from "date-fns";
import { Search, Pencil, Check } from "lucide-react";
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
  getExercisesWithUserPreferences,
  toggleExerciseVisibility,
} from "@/lib/actions/user-exercises";
import {
  getGuestExercises,
  toggleGuestExerciseVisibility,
  saveGuestCustomExercise,
} from "@/lib/local-storage-guest";

interface RecordPageProps {
  initialExercises?: Exercise[];
}

export default function RecordPage({ initialExercises = [] }: RecordPageProps) {
  const searchParams = useSearchParams();
  const { userId } = useAuthSession();

  // --- Date Logic ---
  const getInitialDate = (): Date => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      try {
        const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date());
        if (!isNaN(parsedDate.getTime())) return parsedDate;
      } catch {
        /* ignore */
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
    const loadExercises = async () => {
      if (userId) {
        // ログインユーザー: DBから取得
        const result = await getExercisesWithUserPreferences(userId);
        if (result.success && result.data) {
          setExercises(result.data);
        }
      } else {
        //ゲストユーザー: ローカルストレージとマージ
        // initialExercises (サーバーマスタ) をベースに、LSの設定を適用
        const guestExercises = getGuestExercises(initialExercises);
        setExercises(guestExercises);
      }
    };
    loadExercises();
    // initialExercises を依存配列に入れると無限ループの可能性があるため、
    // ここでは userId の変化のみをトリガーにするか、適切に制御します。
    // 今回は userId と initialExercises の変更を監視します。
  }, [userId, initialExercises]);

  const recalculateStats = useCallback(() => {
    recalculateMaxWeights();
    refreshLastTrained();
  }, [recalculateMaxWeights, refreshLastTrained]);

  useEffect(() => {
    recalculateStats();
  }, [recalculateStats]);

  const filteredExercises = useMemo(() => {
    let result = exercises.filter((e) => e.bodyPart === selectedPart);

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

  const handlePartChange = (part: BodyPart) => {
    if (part === "all") return;
    setSelectedPart(part);
    setSearchQuery("");
    setIsEditMode(false);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    if (isEditMode) {
      handleRemoveExercise(exercise);
      return;
    }
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
    recalculateStats();
  };

  const handleAddExerciseClick = () => {
    setAddExerciseBodyPart(selectedPart);
    setIsAddExerciseModalOpen(true);
    setIsEditMode(false);
  };

  // ゲスト対応
  const handleAddExercise = async (exercise: Exercise) => {
    if (userId) {
      // ログイン時
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
    const newExercise = { ...exercise, tier: "initial" as const };
    setExercises((prev) => {
      const exists = prev.some((e) => e.id === exercise.id);
      if (exists) {
        return prev.map((e) => (e.id === exercise.id ? newExercise : e));
      }
      return [...prev, newExercise];
    });

    recalculateStats();
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
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 space-y-4">
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

        <BodyPartCard
          bodyPart={selectedPart}
          exercises={filteredExercises}
          maxWeights={maxWeights}
          onExerciseSelect={handleExerciseSelect}
          onAddExerciseClick={handleAddExerciseClick}
          isEditMode={isEditMode}
        />
      </main>

      {/* Modals */}
      <ExerciseRecordModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        date={selectedDate}
        prefetchedPreviousRecord={prefetchedRecord}
      />

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
