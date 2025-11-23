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

type PreviousRecordData =
  | { type: "workout"; sets: SetRecord[]; date: Date }
  | { type: "cardio"; records: CardioRecord[]; date: Date }
  | null;

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
    const exerciseId = exercise.id;
    const isCardio = isCardioExercise(exercise);

    const fetchRecord = async () => {
      setIsLoading(true);

      try {
        // 1. ローカルストレージから取得
        let localRecord: PreviousRecordData = null; // 型を明示
        if (isCardio) {
          const res = getLocalPreviousCardio(currentDate, exerciseId);
          if (res) localRecord = { type: "cardio", ...res };
        } else {
          const res = getLocalPreviousWorkout(currentDate, exerciseId);
          if (res) localRecord = { type: "workout", ...res };
        }

        // 2. サーバーから取得（ログイン時のみ）
        let dbRecord: PreviousRecordData = null; // 型を明示
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
            const result = await getLatestSetRecord(
              userId,
              exerciseId,
              currentDate
            );
            if (result.success && result.data) {
              dbRecord = { type: "workout", ...result.data };
            }
          }
        }

        if (!isMounted) return;

        // 3. 比較して新しい方を採用
        if (!localRecord && !dbRecord) {
          setRecord(null);
        } else if (!localRecord) {
          setRecord(dbRecord);
        } else if (!dbRecord) {
          setRecord(localRecord);
        } else {
          // 両方ある場合は日付が新しい方（型ガード済みなので安全にアクセス可能）
          if (dbRecord!.date.getTime() >= localRecord!.date.getTime()) {
            setRecord(dbRecord);
          } else {
            setRecord(localRecord);
          }
        }
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
