"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { deleteExerciseSets, deleteCardioRecords } from "@/lib/api";
import { getWorkoutSession } from "@/lib/api";
import { loadExercisesWithFallback } from "@/lib/local-storage-exercises";
import { useMaxWeights } from "@/hooks/use-max-weights";
import { BodyPartFilter } from "./body-part-filter";
import { HistoryCalendar } from "./history-calendar";
import { SessionHistoryCard } from "./session-history-card";
import { ExerciseRecordModal } from "../record/exercise-record-modal";
import { useHistoryData } from "./hooks/use-history-data";
import {
  deserializeSessionDetails,
  type SerializedSessionDetails,
} from "./types";
import type { Exercise, BodyPart } from "@/types/workout";
import { useAuthSession } from "@/lib/auth-session-context";

interface HistoryPageProps {
  initialMonthDate: string;
  initialBodyPartsByDate: Record<string, BodyPart[]>;
  initialSelectedDate?: string | null;
  initialSessionDetails?: SerializedSessionDetails | null;
  hasInitialMonthData?: boolean;
}

/**
 * 履歴ページコンポーネント
 * カレンダーと履歴表示を統合
 */
export function HistoryPage({
  initialMonthDate,
  initialBodyPartsByDate,
  initialSelectedDate,
  initialSessionDetails,
  hasInitialMonthData = false,
}: HistoryPageProps) {
  const initialMonth = useMemo(
    () => parseISO(initialMonthDate),
    [initialMonthDate]
  );
  const initialSelected = useMemo(
    () => (initialSelectedDate ? parseISO(initialSelectedDate) : null),
    [initialSelectedDate]
  );
  const initialSessionDetailsValue = useMemo(
    () =>
      initialSessionDetails
        ? deserializeSessionDetails(initialSessionDetails)
        : null,
    [initialSessionDetails]
  );

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart>("all");
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedMonthFromSelection(initialSelected) ?? initialMonth
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialSelected
  );
  const [editingExercise, setEditingExercise] = useState<{
    exercise: Exercise;
    date: Date;
  } | null>(null);
  const hasSkippedInitialFetchRef = useRef(false);
  const hasLoadedInitialSessionRef = useRef(false);
  const { userId } = useAuthSession();

  // 最大重量を管理するカスタムフック
  const { maxWeights, recalculateMaxWeights } = useMaxWeights();

  // 履歴データを管理するカスタムフック
  const {
    bodyPartsByDate,
    sessionDetails,
    isLoading,
    loadBodyPartsByDate,
    loadSessionDetails,
  } = useHistoryData(exercises, userId, {
    initialBodyPartsByDate,
    initialSessionDetails: initialSessionDetailsValue,
  });

  // 種目一覧を取得
  const loadExercises = useCallback(async () => {
    const exercises = await loadExercisesWithFallback(undefined, userId);
    setExercises(exercises);
  }, [userId]);

  // 初回マウント時に種目一覧を取得
  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // 種目一覧が読み込まれた後、または月が変更されたときに部位一覧を取得
  useEffect(() => {
    const shouldSkipInitialFetch =
      !hasSkippedInitialFetchRef.current &&
      hasInitialMonthData &&
      isSameMonth(currentMonth, initialMonth);

    if (shouldSkipInitialFetch) {
      hasSkippedInitialFetchRef.current = true;
      return;
    }
    hasSkippedInitialFetchRef.current = true;
    loadBodyPartsByDate(currentMonth);
  }, [currentMonth, hasInitialMonthData, initialMonth, loadBodyPartsByDate]);

  // 種目一覧が読み込まれた後、または月が変更されたときに部位一覧を取得
  useEffect(() => {
    const shouldSkipInitialFetch =
      !hasSkippedInitialFetchRef.current &&
      hasInitialMonthData &&
      isSameMonth(currentMonth, initialMonth);

    if (shouldSkipInitialFetch) {
      hasSkippedInitialFetchRef.current = true;
      return;
    }

    hasSkippedInitialFetchRef.current = true;
    loadBodyPartsByDate(currentMonth);
  }, [currentMonth, hasInitialMonthData, initialMonth, loadBodyPartsByDate]);

  // 初期選択日がある場合、マウント時に一度だけセッション詳細を読み込む
  useEffect(() => {
    // すでに初期ロード済みなら何もしない
    if (hasLoadedInitialSessionRef.current) return;

    // 選択日が存在しない場合は何もしない
    if (!selectedDate) return;

    // SSR から initialSessionDetails が渡されている場合は、
    // それを使えばよいので追加の fetch は不要
    if (initialSessionDetailsValue) {
      hasLoadedInitialSessionRef.current = true;
      return;
    }

    // ここまで来たら「選択日はあるが initialSessionDetails は無い」ケース。
    // → 初回マウント時に一度だけ詳細を取りに行く。
    hasLoadedInitialSessionRef.current = true;
    loadSessionDetails(selectedDate);
  }, [selectedDate, initialSessionDetailsValue, loadSessionDetails]);

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
        const sessionResult = await getWorkoutSession(userId, dateStr);
        if (sessionResult.success && sessionResult.data) {
          // セット記録と有酸素記録の両方を削除（どちらか一方が存在する可能性があるため）
          await Promise.all([
            deleteExerciseSets(userId, {
              sessionId: sessionResult.data.id,
              exerciseId,
            }),
            deleteCardioRecords(userId, {
              sessionId: sessionResult.data.id,
              exerciseId,
            }),
          ]);
        }
      } catch (error) {
        // データベース削除エラーはログのみ（ローカルストレージは削除済み）
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "データベースからの削除に失敗（ローカルストレージは削除済み）:",
            error
          );
        }
      }

      // 履歴を再読み込み
      if (selectedDate) {
        await loadSessionDetails(selectedDate);
        await loadBodyPartsByDate(currentMonth);
        await recalculateMaxWeights();
      }
    },
    [
      userId,
      selectedDate,
      currentMonth,
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
      loadBodyPartsByDate(currentMonth);
      // 最大重量も再読み込み（編集により最大重量が更新された可能性があるため）
      recalculateMaxWeights();
    }
  }, [
    selectedDate,
    currentMonth,
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
        <div className="mb-6">
          <HistoryCalendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            bodyPartsByDate={bodyPartsByDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            filteredBodyPart={selectedBodyPart}
          />
        </div>

        {/* 選択日の履歴表示 */}
        {selectedDate && (
          <div className="mt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                読み込み中...
              </div>
            ) : (
              <SessionHistoryCard
                date={sessionDetails?.date || selectedDate}
                durationMinutes={sessionDetails?.durationMinutes}
                note={sessionDetails?.note}
                workoutExercises={sessionDetails?.workoutExercises || []}
                cardioExercises={sessionDetails?.cardioExercises || []}
                exercises={exercises}
                onExerciseClick={handleExerciseClick}
                onExerciseDelete={handleExerciseDelete}
                maxWeights={maxWeights}
              />
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

function selectedMonthFromSelection(selectedDate: Date | null) {
  if (!selectedDate) {
    return undefined;
  }
  return startOfMonth(selectedDate);
}
