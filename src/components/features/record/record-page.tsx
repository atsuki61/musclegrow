"use client";

import { useState } from "react";
import { DateSelector } from "./date-selector";
import { BodyPartNavigation } from "./body-part-navigation";
import { BodyPartCard } from "./body-part-card";
import { ExerciseRecordModal } from "./exercise-record-modal";
import { mockInitialExercises } from "@/lib/mock-exercises";
import { BODY_PART_LABELS } from "@/lib/utils";
import type { BodyPart, Exercise } from "@/types/workout";

export function RecordPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPart, setSelectedPart] = useState<BodyPart>("all");
  // 初期値として直接設定（useEffectを使わない）
  const [exercises] = useState<Exercise[]>(mockInitialExercises);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TODO: 実際のAPIからデータを取得（現時点ではダミーデータ）
  // 将来的に日付や部位が変更された時にデータを再取得する場合は、以下のuseEffectを使用
  // useEffect(() => {
  //   // 実際のAPIからデータを取得
  //   fetchExercises(selectedDate, selectedPart).then(setExercises);
  // }, [selectedDate, selectedPart]);

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
