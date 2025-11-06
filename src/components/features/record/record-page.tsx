"use client";

import { useState, useEffect } from "react";
import { DateSelector } from "./date-selector";
import { BodyPartNavigation } from "./body-part-navigation";
import { BodyPartCard } from "./body-part-card";
import { ExerciseRecordModal } from "./exercise-record-modal";
import { mockInitialExercises } from "@/lib/mock-exercises";
import type { BodyPart, Exercise } from "@/types/workout";

// 部位名のラベル定義
const BODY_PART_LABELS: Record<Exclude<BodyPart, "all">, string> = {
  chest: "胸",
  back: "背中",
  legs: "脚",
  shoulders: "肩",
  arms: "腕",
  core: "腹筋",
  other: "その他",
};

export function RecordPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPart, setSelectedPart] = useState<BodyPart>("all");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TODO: 実際のAPIからデータを取得（現時点ではダミーデータ）
  useEffect(() => {
    // ダミーデータ（実際のAPIから取得する予定）
    // 種目.mdの星マーク（☆）= tier: "initial" の種目をすべて含める
    setExercises(mockInitialExercises);
  }, [selectedDate, selectedPart]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // TODO: 日付変更時にデータを再取得
  };

  const handlePartChange = (part: BodyPart) => {
    setSelectedPart(part);
    // TODO: 部位変更時にフィルタリング
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  // 表示する部位を決定
  const bodyPartsToShow: Exclude<BodyPart, "all">[] =
    selectedPart === "all"
      ? ["chest", "back", "legs", "shoulders", "arms", "core", "other"]
      : [selectedPart];

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
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="space-y-4">
          {bodyPartsToShow.map((bodyPart) => {
            const bodyPartExercises = exercises.filter(
              (e) => e.bodyPart === bodyPart
            );
            return (
              <BodyPartCard
                key={bodyPart}
                bodyPart={BODY_PART_LABELS[bodyPart]}
                exercises={bodyPartExercises}
                onExerciseSelect={handleExerciseSelect}
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
      />
    </div>
  );
}
