"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  getSessionDetails,
  getExercises,
  getWorkoutSession,
  getBodyPartsByDateRange,
} from "@/lib/api";
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

  // 種目一覧を取得
  const loadExercises = useCallback(async () => {
    try {
      const result = await getExercises();
      if (result.success && result.data) {
        setExercises(result.data);
      }
    } catch (error) {
      console.error("種目取得エラー:", error);
    }
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

  // 日付ごとの部位一覧を取得
  const loadBodyPartsByDate = useCallback(async () => {
    try {
      const result = await getBodyPartsByDateRange(monthRange);
      if (result.success && result.data) {
        setBodyPartsByDate(result.data || {});
      }
    } catch (error) {
      console.error("部位一覧取得エラー:", error);
    }
  }, [monthRange]);

  // 選択された日付のセッション詳細を取得
  const loadSessionDetails = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const sessionResult = await getWorkoutSession(dateStr);

      if (sessionResult.success && sessionResult.data) {
        const detailsResult = await getSessionDetails(sessionResult.data.id);
        if (detailsResult.success && detailsResult.data) {
          setSessionDetails({
            ...detailsResult.data,
            date,
            durationMinutes: sessionResult.data.durationMinutes,
            note: sessionResult.data.note,
          });
        } else {
          setSessionDetails(null);
        }
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

  // 月が変更されたときに部位一覧を取得
  useEffect(() => {
    loadBodyPartsByDate();
  }, [loadBodyPartsByDate]);

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

  // 編集モーダルを閉じる
  const handleCloseModal = useCallback(() => {
    setEditingExercise(null);
    // 編集後に履歴を再読み込み
    if (selectedDate) {
      loadSessionDetails(selectedDate);
      // 部位一覧も再読み込み
      loadBodyPartsByDate();
    }
  }, [selectedDate, loadSessionDetails, loadBodyPartsByDate]);

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">履歴</h1>

      {/* 部位別フィルター */}
      <BodyPartFilter
        selectedPart={selectedBodyPart}
        onPartChange={setSelectedBodyPart}
      />

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
  );
}
