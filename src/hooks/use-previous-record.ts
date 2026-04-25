"use client";

import { useState, useEffect } from "react";
import {
  getPreviousWorkoutRecord as getLocalPreviousWorkout,
  getPreviousCardioRecord as getLocalPreviousCardio,
} from "@/lib/previous-record";
import { getLatestSetRecord } from "@/lib/actions/sets";
import { getLatestCardioRecord } from "@/lib/actions/cardio-records";
import { useAuthSession } from "@/lib/auth-session-context";
import type { SetRecord, CardioRecord } from "@/types/workout";
import { isCardioExercise } from "@/lib/utils";
import type { Exercise } from "@/types/workout";

export type PreviousRecordData =
  | { type: "workout"; sets: SetRecord[]; date: Date }
  | { type: "cardio"; records: CardioRecord[]; date: Date }
  | null;

export async function fetchPreviousRecord(
  currentDate: Date,
  exercise: Exercise | null,
  userId: string | null
): Promise<PreviousRecordData> {
  if (!exercise) return null;

  const exerciseId = exercise.id;
  const isCardio = isCardioExercise(exercise);

  // 1. ローカルストレージから取得
  let localRecord: PreviousRecordData = null;
  if (isCardio) {
    const res = getLocalPreviousCardio(currentDate, exerciseId);
    if (res) localRecord = { type: "cardio", ...res };
  } else {
    const res = getLocalPreviousWorkout(currentDate, exerciseId);
    if (res) localRecord = { type: "workout", ...res };
  }

  // 2. サーバーから取得（ログイン時のみ）
  let dbRecord: PreviousRecordData = null;
  if (userId) {
    if (isCardio) {
      const result = await getLatestCardioRecord(
        userId,
        exerciseId,
        currentDate
      );
      if (result.success && result.data) {
        dbRecord = { type: "cardio", ...result.data };
      }
    } else {
      const result = await getLatestSetRecord(userId, exerciseId, currentDate);
      if (result.success && result.data) {
        dbRecord = { type: "workout", ...result.data };
      }
    }
  }

  // 3. 比較して新しい方を採用
  if (!localRecord && !dbRecord) return null;
  if (!localRecord) return dbRecord;
  if (!dbRecord) return localRecord;

  return dbRecord.date.getTime() >= localRecord.date.getTime()
    ? dbRecord
    : localRecord;
}

export function usePreviousRecord(
  currentDate: Date,
  exercise: Exercise | null
) {
  const { userId } = useAuthSession();
  const [record, setRecord] = useState<PreviousRecordData>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!exercise) {
      setRecord(null);
      return;
    }

    let isMounted = true;

    const fetchRecord = async () => {
      setIsLoading(true);
      setRecord(null);

      try {
        if (!isMounted) return;
        const previousRecord = await fetchPreviousRecord(
          currentDate,
          exercise,
          userId
        );
        if (isMounted) setRecord(previousRecord);
      } catch (e) {
        console.error("前回記録取得エラー", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRecord();

    return () => {
      isMounted = false;
    };
  }, [currentDate, exercise, userId]);

  return { record, isLoading };
}
