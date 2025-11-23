"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { parse } from "date-fns";
import { Search, Filter } from "lucide-react";
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
import {
  loadExercisesWithFallback,
  addExerciseToStorage,
} from "@/lib/local-storage-exercises";
import { useAuthSession } from "@/lib/auth-session-context";
import type { BodyPart, Exercise } from "@/types/workout";
import { getLastTrainedDatesByBodyPart } from "@/lib/last-trained";

interface RecordPageProps {
  initialExercises?: Exercise[];
}

export function RecordPage({ initialExercises = [] }: RecordPageProps) {
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

  // Modals & Selection
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [addExerciseBodyPart, setAddExerciseBodyPart] =
    useState<Exclude<BodyPart, "all">>("chest");

  // フック呼び出し
  const { maxWeights, recalculateMaxWeights } = useMaxWeights();
  // ▼ 修正: 新しいフックを使用
  const { lastTrainedDates, refresh: refreshLastTrained } =
    useLastTrainedDates();

  // lastTrainedDatesByBodyPart を計算（useMemoで最適化）
  const lastTrainedDatesByBodyPart = useMemo(() => {
    return getLastTrainedDatesByBodyPart(exercises, lastTrainedDates);
  }, [exercises, lastTrainedDates]);

  useEffect(() => {
    const loadExercises = async () => {
      const exercisesList = await loadExercisesWithFallback(
        initialExercises,
        userId
      );
      setExercises(exercisesList);
    };
    loadExercises();
  }, [initialExercises, userId]);

  const recalculateStats = useCallback(() => {
    recalculateMaxWeights();
    refreshLastTrained();
  }, [recalculateMaxWeights, refreshLastTrained]);

  useEffect(() => {
    recalculateStats();
  }, [recalculateStats]);

  // --- Filtering Logic ---
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

  // --- Handlers ---
  const handleDateChange = (date: Date) => setSelectedDate(date);
  const handlePartChange = (part: Exclude<BodyPart, "all">) => {
    setSelectedPart(part);
    setSearchQuery(""); // 部位変更時に検索リセット
  };

  const handleExerciseSelect = (exercise: Exercise) => {
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
  };

  const handleAddExercise = async (exercise: Exercise) => {
    addExerciseToStorage(exercise);
    if (exercise.tier === "custom") {
      const result = await saveExercise(userId, exercise);
      if (!result.success) console.error("種目保存エラー:", result.error);
    }
    setExercises((prev) => [...prev, exercise]);
    recalculateStats();
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* Header (Sticky) */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-14 items-center justify-center px-4">
          <DateSelector date={selectedDate} onDateChange={handleDateChange} />
        </div>

        {/* Navigation */}
        <div className="px-2 pb-1">
          <BodyPartNavigation
            selectedPart={selectedPart}
            onPartChange={handlePartChange}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 space-y-4">
        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="種目を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/40 border-border/50 rounded-xl focus-visible:ring-orange-500"
          />
        </div>

        {/* 種目カード一覧 */}
        <BodyPartCard
          bodyPart={selectedPart}
          exercises={filteredExercises}
          maxWeights={maxWeights}
          // ▼ 追加: 最終トレーニング日を渡す（BodyPartCard側で対応が必要なら修正するが、今回はprops定義にはないので無視されるか、もし必要ならBodyPartCardも修正）
          // 現状のBodyPartCard実装ではlastTrainedAtは使われていない（カードリスト表示だけ）ようなので、
          // 部位ごとの最終日表示が必要なら、BodyPartNavigationなどに渡す必要があるかもしれません。
          // いったんここでは計算ロジックの統合のみ完了しています。
          onExerciseSelect={handleExerciseSelect}
          onAddExerciseClick={handleAddExerciseClick}
        />
      </main>

      {/* フィルターボタン (Floating Action Button) */}
      <div className="fixed bottom-24 right-5 z-40">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full bg-black text-white shadow-lg hover:bg-black/90 active:scale-95 transition-all"
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* Modals */}
      <ExerciseRecordModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        date={selectedDate}
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
