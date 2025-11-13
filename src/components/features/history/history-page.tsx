"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  getSessionDetails,
  getWorkoutSession,
  getBodyPartsByDateRange,
  deleteExerciseSets,
  deleteCardioRecords,
} from "@/lib/api";
import { getBodyPartsByDateRangeFromStorage } from "@/lib/local-storage-history";
import { getSessionDetailsFromStorage } from "@/lib/local-storage-session-details";
import { loadExercisesWithFallback } from "@/lib/local-storage-exercises";
import { useMaxWeights } from "@/hooks/use-max-weights";
import { BodyPartFilter } from "./body-part-filter";
import { HistoryCalendar } from "./history-calendar";
import { SessionHistoryCard } from "./session-history-card";
import { ExerciseRecordModal } from "../record/exercise-record-modal";
import type {
  Exercise,
  SetRecord,
  CardioRecord,
  BodyPart,
} from "@/types/workout";

/**
 * 履歴ページコンポーネント
 * カレンダーと履歴表示を統合
 */
export function HistoryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart>("all");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bodyPartsByDate, setBodyPartsByDate] = useState<
    Record<string, BodyPart[]>
  >({});
  const [sessionDetails, setSessionDetails] = useState<{
    workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
    cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
    date: Date;
    durationMinutes?: number | null;
    note?: string | null;
  } | null>(null);
  const [editingExercise, setEditingExercise] = useState<{
    exercise: Exercise;
    date: Date;
  } | null>(null);

  // 最大重量を管理するカスタムフック
  const { maxWeights, recalculateMaxWeights } = useMaxWeights();

  // 種目一覧を取得
  const loadExercises = useCallback(async () => {
    const exercises = await loadExercisesWithFallback();
    setExercises(exercises);
  }, []);

  // 現在の月の範囲を計算
  const monthRange = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  }, [currentMonth]);

  // 日付ごとの部位一覧を取得（データベース + ローカルストレージ）
  const loadBodyPartsByDate = useCallback(async () => {
    try {
      // データベースから取得
      const dbResult = await getBodyPartsByDateRange(monthRange);
      const dbBodyParts = dbResult.success ? dbResult.data || {} : {};

      // ローカルストレージから取得
      const startDate = new Date(monthRange.startDate + "T00:00:00");
      const endDate = new Date(monthRange.endDate + "T23:59:59");
      const storageBodyParts = getBodyPartsByDateRangeFromStorage({
        startDate,
        endDate,
        exercises,
      });

      // マージ: 同じ日付の部位を統合（重複を排除）
      const merged: Record<string, BodyPart[]> = { ...dbBodyParts };
      Object.keys(storageBodyParts).forEach((date) => {
        if (merged[date]) {
          const existingSet = new Set(merged[date]);
          storageBodyParts[date].forEach((part) => existingSet.add(part));
          merged[date] = Array.from(existingSet);
        } else {
          merged[date] = storageBodyParts[date];
        }
      });

      setBodyPartsByDate(merged);
    } catch (error) {
      console.error("部位一覧取得エラー:", error);
    }
  }, [monthRange, exercises]);

  // 選択された日付のセッション詳細を取得（データベース + ローカルストレージ）
  const loadSessionDetails = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");

      // データベースから取得を試みる
      const sessionResult = await getWorkoutSession(dateStr);
      let dbDetails: {
        workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
        cardioExercises: Array<{
          exerciseId: string;
          records: CardioRecord[];
        }>;
      } | null = null;
      let dbNote: string | null | undefined = null;
      let dbDurationMinutes: number | null | undefined = null;

      if (sessionResult.success && sessionResult.data) {
        const detailsResult = await getSessionDetails(sessionResult.data.id);
        if (detailsResult.success && detailsResult.data) {
          dbDetails = detailsResult.data;
          dbNote = sessionResult.data.note;
          dbDurationMinutes = sessionResult.data.durationMinutes;
        }
      }

      // ローカルストレージから取得
      const storageDetails = getSessionDetailsFromStorage({ date });

      // データベースとローカルストレージの結果をマージ
      const workoutExercisesMap = new Map<string, SetRecord[]>();
      const cardioExercisesMap = new Map<string, CardioRecord[]>();

      // データベースの結果を追加
      if (dbDetails) {
        dbDetails.workoutExercises.forEach(({ exerciseId, sets }) => {
          workoutExercisesMap.set(exerciseId, sets);
        });
        dbDetails.cardioExercises.forEach(({ exerciseId, records }) => {
          cardioExercisesMap.set(exerciseId, records);
        });
      }

      // ローカルストレージの結果を追加（データベースにない種目のみ）
      storageDetails.workoutExercises.forEach(({ exerciseId, sets }) => {
        if (!workoutExercisesMap.has(exerciseId)) {
          workoutExercisesMap.set(exerciseId, sets);
        }
      });
      storageDetails.cardioExercises.forEach(({ exerciseId, records }) => {
        if (!cardioExercisesMap.has(exerciseId)) {
          cardioExercisesMap.set(exerciseId, records);
        }
      });

      const mergedWorkoutExercises = Array.from(
        workoutExercisesMap.entries()
      ).map(([exerciseId, sets]) => ({ exerciseId, sets }));
      const mergedCardioExercises = Array.from(
        cardioExercisesMap.entries()
      ).map(([exerciseId, records]) => ({ exerciseId, records }));

      // どちらか一方でもデータがあれば表示
      if (
        mergedWorkoutExercises.length > 0 ||
        mergedCardioExercises.length > 0
      ) {
        setSessionDetails({
          workoutExercises: mergedWorkoutExercises,
          cardioExercises: mergedCardioExercises,
          date,
          durationMinutes: dbDurationMinutes,
          note: dbNote,
        });
      } else {
        setSessionDetails(null);
      }
    } catch (error) {
      console.error("セッション詳細取得エラー:", error);
      setSessionDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回マウント時に種目一覧を取得
  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // 種目一覧が読み込まれた後、または月が変更されたときに部位一覧を取得
  useEffect(() => {
    // exercisesが空でも実行する（ローカルストレージから取得するため）
    loadBodyPartsByDate();
  }, [loadBodyPartsByDate, exercises]);

  // 日付選択時の処理
  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      loadSessionDetails(date);
    },
    [loadSessionDetails]
  );

  // 種目クリック時の処理
  const handleExerciseClick = useCallback((exercise: Exercise, date: Date) => {
    setEditingExercise({ exercise, date });
  }, []);

  // 種目削除時の処理
  const handleExerciseDelete = useCallback(
    async (exerciseId: string, date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");

      // ローカルストレージから削除
      const workoutStorageKey = `workout_${dateStr}_${exerciseId}`;
      const cardioStorageKey = `cardio_${dateStr}_${exerciseId}`;
      localStorage.removeItem(workoutStorageKey);
      localStorage.removeItem(cardioStorageKey);

      // データベースからも削除を試みる
      try {
        const sessionResult = await getWorkoutSession(dateStr);
        if (sessionResult.success && sessionResult.data) {
          // セット記録と有酸素記録の両方を削除（どちらか一方が存在する可能性があるため）
          await Promise.all([
            deleteExerciseSets({
              sessionId: sessionResult.data.id,
              exerciseId,
            }),
            deleteCardioRecords({
              sessionId: sessionResult.data.id,
              exerciseId,
            }),
          ]);
        }
      } catch (error) {
        // データベース削除エラーはログのみ（ローカルストレージは削除済み）
        if (process.env.NODE_ENV === "development") {
          console.warn("データベースからの削除に失敗（ローカルストレージは削除済み）:", error);
        }
      }

      // 履歴を再読み込み
      if (selectedDate) {
        await loadSessionDetails(selectedDate);
        await loadBodyPartsByDate();
        await recalculateMaxWeights();
      }
    },
    [
      selectedDate,
      loadSessionDetails,
      loadBodyPartsByDate,
      recalculateMaxWeights,
    ]
  );

  // 編集モーダルを閉じる
  const handleCloseModal = useCallback(async () => {
    setEditingExercise(null);
    // 編集後に履歴を再読み込み（保存完了を待機）
    if (selectedDate) {
      // データベースへの保存が完了するまで少し待機
      await new Promise((resolve) => setTimeout(resolve, 300));
      loadSessionDetails(selectedDate);
      // 部位一覧も再読み込み
      loadBodyPartsByDate();
      // 最大重量も再読み込み（編集により最大重量が更新された可能性があるため）
      recalculateMaxWeights();
    }
  }, [
    selectedDate,
    loadSessionDetails,
    loadBodyPartsByDate,
    recalculateMaxWeights,
  ]);

  return (
    <>
      {/* 部位別フィルター（headerの真下に配置） */}
      <div className="sticky top-14 z-40 w-full border-b bg-background px-4 py-0">
        <BodyPartFilter
          selectedPart={selectedBodyPart}
          onPartChange={setSelectedBodyPart}
        />
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* カレンダー */}
        <HistoryCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          bodyPartsByDate={bodyPartsByDate}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          filteredBodyPart={selectedBodyPart}
        />

        {/* 選択日の履歴表示 */}
        {selectedDate && (
          <div className="mt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                読み込み中...
              </div>
            ) : sessionDetails ? (
              <SessionHistoryCard
                date={sessionDetails.date}
                durationMinutes={sessionDetails.durationMinutes}
                note={sessionDetails.note}
                workoutExercises={sessionDetails.workoutExercises}
                cardioExercises={sessionDetails.cardioExercises}
                exercises={exercises}
                onExerciseClick={handleExerciseClick}
                onExerciseDelete={handleExerciseDelete}
                maxWeights={maxWeights}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                この日の記録はありません
              </div>
            )}
          </div>
        )}

        {/* 編集モーダル */}
        {editingExercise && (
          <ExerciseRecordModal
            exercise={editingExercise.exercise}
            isOpen={true}
            onClose={handleCloseModal}
            date={editingExercise.date}
          />
        )}
      </div>
    </>
  );
}
