"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { deleteExerciseSets, deleteCardioRecords } from "@/lib/api";
import { getWorkoutSession } from "@/lib/api";
import { useMaxWeights } from "@/hooks/use-max-weights";
import { BodyPartFilter } from "./body-part-filter";
import { useHistoryData } from "./hooks/use-history-data";
import { loadExercisesWithFallback } from "@/lib/local-storage-exercises";
import {
  deserializeSessionDetails,
  type SerializedSessionDetails,
} from "./types";
import type { Exercise, BodyPart } from "@/types/workout";
import { useAuthSession } from "@/lib/auth-session-context";
import dynamic from "next/dynamic";
import { HistoryCalendarSkeleton } from "./history-calendar-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

const SessionHistoryCard = dynamic(() => import("./session-history-card"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 mt-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  ),
});

const ExerciseRecordModal = dynamic(
  () => import("../record/exercise-record-modal"),
  { ssr: false }
);

const HistoryCalendar = dynamic(() => import("./history-calendar"), {
  ssr: false,
  loading: () => <HistoryCalendarSkeleton />,
});

interface HistoryPageProps {
  initialMonthDate: string;
  initialBodyPartsByDate: Record<string, BodyPart[]>;
  initialSelectedDate?: string | null;
  initialSessionDetails?: SerializedSessionDetails | null;
}

export function HistoryPage({
  initialMonthDate,
  initialBodyPartsByDate,
  initialSelectedDate,
  initialSessionDetails,
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

  const loadExercises = useCallback(async () => {
    const items = await loadExercisesWithFallback(undefined, userId);
    setExercises(items);
  }, [userId]);

  const { maxWeights, recalculateMaxWeights } = useMaxWeights();

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handle = window.setTimeout(() => loadExercises(), 500);
    return () => window.clearTimeout(handle);
  }, [loadExercises]);

  useEffect(() => {
    if (!hasSkippedInitialFetchRef.current) {
      hasSkippedInitialFetchRef.current = true;
      return;
    }
    loadBodyPartsByDate(currentMonth);
  }, [currentMonth, loadBodyPartsByDate]);

  useEffect(() => {
    if (hasLoadedInitialSessionRef.current) return;
    if (!selectedDate) return;
    if (initialSessionDetailsValue) {
      hasLoadedInitialSessionRef.current = true;
      return;
    }
    hasLoadedInitialSessionRef.current = true;
    loadSessionDetails(selectedDate);
  }, [selectedDate, initialSessionDetailsValue, loadSessionDetails]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      loadSessionDetails(date);
    },
    [loadSessionDetails]
  );

  const handleExerciseClick = useCallback((exercise: Exercise, date: Date) => {
    setEditingExercise({ exercise, date });
  }, []);

  const handleExerciseDelete = useCallback(
    async (exerciseId: string, date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      localStorage.removeItem(`workout_${dateStr}_${exerciseId}`);
      localStorage.removeItem(`cardio_${dateStr}_${exerciseId}`);

      try {
        const sessionResult = await getWorkoutSession(userId, dateStr);
        if (sessionResult.success && sessionResult.data) {
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
        if (process.env.NODE_ENV === "development") console.warn(error);
      }

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

  const handleCloseModal = useCallback(async () => {
    setEditingExercise(null);
    if (selectedDate) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      loadSessionDetails(selectedDate);
      loadBodyPartsByDate(currentMonth);
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
    <div className="min-h-screen bg-background pb-20">
      {/* フィルター (Sticky) */}
      <div className="sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur px-4 py-2">
        <BodyPartFilter
          selectedPart={selectedBodyPart}
          onPartChange={setSelectedBodyPart}
        />
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* カレンダー */}
        <section>
          <HistoryCalendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            bodyPartsByDate={bodyPartsByDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            filteredBodyPart={selectedBodyPart}
          />
        </section>

        {/* 選択日の履歴表示 */}
        {selectedDate && (
          <section>
            {isLoading ? (
              <div className="space-y-4 mt-6 animate-pulse">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
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
          </section>
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
    </div>
  );
}

function selectedMonthFromSelection(selectedDate: Date | null) {
  if (!selectedDate) return undefined;
  return startOfMonth(selectedDate);
}
