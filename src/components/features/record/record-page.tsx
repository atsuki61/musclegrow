"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { parse } from "date-fns";
import { DateSelector } from "./date-selector";
import { BodyPartNavigation } from "./body-part-navigation";
import { BodyPartCard } from "./body-part-card";
import { ExerciseRecordModal } from "./exercise-record-modal";
import { AddExerciseModal } from "./add-exercise-modal";
import { saveExercise } from "@/lib/api";
import { BODY_PART_LABELS } from "@/lib/utils";
import { useMaxWeights } from "@/hooks/use-max-weights";
import {
  getLastTrainedDates,
  getLastTrainedDatesByBodyPart,
} from "@/lib/last-trained";
import {
  loadExercisesWithFallback,
  addExerciseToStorage,
} from "@/lib/local-storage-exercises";
import type { BodyPart, Exercise } from "@/types/workout";

interface RecordPageProps {
  initialExercises?: Exercise[];
}

function getBodyPartsToShow(
  selectedPart: Exclude<BodyPart, "all">
): Exclude<BodyPart, "all">[] {
  return [selectedPart];
}

export function RecordPage({ initialExercises = [] }: RecordPageProps) {
  const searchParams = useSearchParams();

  // クエリパラメータから日付を取得（例: /record?date=2024-11-13）
  const getInitialDate = (): Date => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      try {
        // yyyy-MM-dd 形式の日付をパース
        const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date());
        // 有効な日付かチェック
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } catch {
        // パースエラー時は今日の日付を使用
      }
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());
  const [selectedPart, setSelectedPart] = useState<Exclude<BodyPart, "all">>("chest");
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [addExerciseBodyPart, setAddExerciseBodyPart] =
    useState<Exclude<BodyPart, "all">>("chest");
  const [lastTrainedDatesByBodyPart, setLastTrainedDatesByBodyPart] = useState<
    Record<BodyPart, Date | undefined>
  >({} as Record<BodyPart, Date | undefined>);

  // 最大重量を管理するカスタムフック
  const { maxWeights, recalculateMaxWeights } = useMaxWeights();

  useEffect(() => {
    const loadExercises = async () => {
      const exercisesList = await loadExercisesWithFallback(initialExercises);
      setExercises(exercisesList);
    };
    loadExercises();
  }, [initialExercises]);

  const recalculateStats = useCallback(() => {
    // 最大重量はカスタムフックで管理されるため、ここでは再計算のみ呼び出す
    recalculateMaxWeights();
    const lastTrainedDates = getLastTrainedDates();
    setLastTrainedDatesByBodyPart(
      getLastTrainedDatesByBodyPart(exercises, lastTrainedDates)
    );
  }, [exercises, recalculateMaxWeights]);

  useEffect(() => {
    recalculateStats();
  }, [recalculateStats]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePartChange = (part: Exclude<BodyPart, "all">) => {
    setSelectedPart(part);
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

  const handleAddExerciseClick = (bodyPart: Exclude<BodyPart, "all">) => {
    setAddExerciseBodyPart(bodyPart);
    setIsAddExerciseModalOpen(true);
  };

  const addExerciseToState = (exercise: Exercise) => {
    setExercises((prev) => [...prev, exercise]);
  };

  const saveCustomExercise = async (exercise: Exercise) => {
    const result = await saveExercise(exercise);
    if (result.success && result.data) {
      addExerciseToState(result.data);
    } else {
      console.error("種目保存エラー:", result.error);
      addExerciseToState(exercise);
    }
  };

  const handleAddExercise = async (exercise: Exercise) => {
    addExerciseToStorage(exercise);

    if (exercise.tier === "custom") {
      await saveCustomExercise(exercise);
    } else {
      addExerciseToState(exercise);
    }
    recalculateStats();
  };

  const handleAddExerciseModalClose = () => {
    setIsAddExerciseModalOpen(false);
  };

  const bodyPartsToShow = getBodyPartsToShow(selectedPart);

  return (
    <div className="flex flex-col min-h-screen -mt-14">
      {/* Headerエリア */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="flex h-14 items-center justify-center px-4">
          {/* 日付選択を中央配置 */}
          <DateSelector date={selectedDate} onDateChange={handleDateChange} />
        </div>
      </header>

      {/* 部位ナビゲーションエリア */}
      <nav className="sticky top-14 z-40 w-full border-b bg-background">
        <div className="px-4">
          <BodyPartNavigation
            selectedPart={selectedPart}
            onPartChange={handlePartChange}
          />
        </div>
      </nav>

      {/* メインコンテンツエリア */}
      <main className="flex-1 container mx-auto px-3 py-2">
        <div className="space-y-2">
          {bodyPartsToShow.map((bodyPart) => {
            const bodyPartExercises = exercises.filter(
              (e) => e.bodyPart === bodyPart
            );
            return (
              <BodyPartCard
                key={bodyPart}
                bodyPart={BODY_PART_LABELS[bodyPart]}
                exercises={bodyPartExercises}
                maxWeights={maxWeights}
                lastTrainedAt={lastTrainedDatesByBodyPart[bodyPart]}
                onExerciseSelect={handleExerciseSelect}
                onAddExerciseClick={() => handleAddExerciseClick(bodyPart)}
              />
            );
          })}
        </div>
      </main>

      {/* 種目記録モーダル */}
      <ExerciseRecordModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        date={selectedDate}
      />

      {/* 種目追加モーダル */}
      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={handleAddExerciseModalClose}
        onAddExercise={handleAddExercise}
        allExercises={exercises}
        initialBodyPart={addExerciseBodyPart}
      />
    </div>
  );
}
