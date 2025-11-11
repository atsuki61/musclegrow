"use client";

import { useState, useEffect, useCallback } from "react";
import { DateSelector } from "./date-selector";
import { BodyPartNavigation } from "./body-part-navigation";
import { BodyPartCard } from "./body-part-card";
import { ExerciseRecordModal } from "./exercise-record-modal";
import { AddExerciseModal } from "./add-exercise-modal";
import { mockInitialExercises } from "@/lib/mock-exercises";
import { getExercises, saveExercise } from "@/lib/api";
import { BODY_PART_LABELS } from "@/lib/utils";
import { calculateMaxWeights } from "@/lib/max-weight";
import {
  getLastTrainedDates,
  getLastTrainedDatesByBodyPart,
} from "@/lib/last-trained";
import type { BodyPart, Exercise } from "@/types/workout";

export function RecordPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPart, setSelectedPart] = useState<BodyPart>("all");
  // 初期値としてモックデータを設定（データベースから取得するまで）
  const [exercises, setExercises] = useState<Exercise[]>(mockInitialExercises);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [addExerciseBodyPart, setAddExerciseBodyPart] =
    useState<Exclude<BodyPart, "all">>("chest");
  // MAX重量の状態（初期値は空のオブジェクトでサーバー/クライアント一致を保証）
  const [maxWeights, setMaxWeights] = useState<Record<string, number>>({});
  // 最後のトレーニング日時の状態（初期値は空のオブジェクトでサーバー/クライアント一致を保証）
  const [lastTrainedDatesByBodyPart, setLastTrainedDatesByBodyPart] = useState<
    Record<BodyPart, Date | undefined>
  >({} as Record<BodyPart, Date | undefined>);

  // ページロード時にデータベースから種目を取得
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const result = await getExercises();
        if (result.success && result.data) {
          // データベースから取得した種目とモックデータをマージ
          // モックデータは共通マスタとして扱い、データベースにない場合は使用
          const dbExerciseIds = new Set(result.data.map((e) => e.id));
          const mockExercisesToAdd = mockInitialExercises.filter(
            (e) => !dbExerciseIds.has(e.id)
          );
          setExercises([...result.data, ...mockExercisesToAdd]);
        }
        // result.successがfalseでも、result.dataが空配列の場合はモックデータを使用するため
        // エラーログは出力しない（サーバー側で既に処理済み）
      } catch (error) {
        // 予期しないエラーの場合のみ開発環境でログ出力
        if (process.env.NODE_ENV === "development") {
          console.error("種目取得エラー:", error);
        }
        // エラー時はモックデータのみを使用（既に初期値として設定済み）
      }
    };

    loadExercises();
  }, []);

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

  /**
   * MAX重量と最後のトレーニング日時を再計算する
   */
  const recalculateStats = useCallback(() => {
    const newMaxWeights = calculateMaxWeights();
    setMaxWeights(newMaxWeights);
    const lastTrainedDates = getLastTrainedDates();
    setLastTrainedDatesByBodyPart(
      getLastTrainedDatesByBodyPart(exercises, lastTrainedDates)
    );
  }, [exercises]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
    // モーダルが閉じたときに統計情報を再計算
    recalculateStats();
  };

  /**
   * 種目追加モーダルを開く
   */
  const handleAddExerciseClick = (bodyPart: Exclude<BodyPart, "all">) => {
    setAddExerciseBodyPart(bodyPart);
    setIsAddExerciseModalOpen(true);
  };

  /**
   * 種目を追加する
   */
  const handleAddExercise = async (exercise: Exercise) => {
    // カスタム種目の場合はデータベースに保存
    if (exercise.tier === "custom") {
      const result = await saveExercise(exercise);
      if (result.success && result.data) {
        // データベースに保存された種目をリストに追加
        setExercises((prev) => [...prev, result.data!]);
      } else {
        console.error("種目保存エラー:", result.error);
        // エラー時でも一時的にリストに追加（UX向上のため）
        setExercises((prev) => [...prev, exercise]);
      }
    } else {
      // 既存種目を選択した場合は、そのままリストに追加（tierを"initial"に変更済み）
      setExercises((prev) => [...prev, exercise]);
    }
    // 種目が追加されたときに統計情報を再計算
    recalculateStats();
  };

  /**
   * 種目追加モーダルを閉じる
   */
  const handleAddExerciseModalClose = () => {
    setIsAddExerciseModalOpen(false);
  };

  // クライアント側でのみ統計情報を計算（Hydrationエラーを防ぐため）
  useEffect(() => {
    recalculateStats();
  }, [recalculateStats]);

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
