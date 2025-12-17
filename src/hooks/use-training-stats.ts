/**
 * トレーニング統計データを管理するカスタムフック
 * 種目別データをサーバー/ローカルから取得してマージ
 */

import { useState, useEffect, useCallback } from "react";
import {
  getBig3ProgressData,
  getExerciseProgressData,
} from "@/lib/actions/stats";
import { getBig3ProgressDataFromStorage } from "@/lib/local-storage-big3-progress";
import {
  getExerciseProgressDataFromStorage,
  getExercisesWithDataFromStorage,
} from "@/lib/local-storage-exercise-progress";
import { identifyBig3Exercises, mergeProgressData } from "@/lib/utils/stats";
import { useAuthSession } from "@/lib/auth-session-context";
import { shouldUseDbOnly } from "@/lib/data-source";
import type {
  DateRangePreset,
  ExerciseProgressData,
  Big3ProgressData,
} from "@/types/stats";
import type { Exercise } from "@/types/workout";

interface UseTrainingStatsOptions {
  exercises: Exercise[];
  trainingDateRange: DateRangePreset;
  selectedExerciseId: string | null;
  initialExercisesWithData?: string[];
}

interface UseTrainingStatsReturn {
  exerciseData: ExerciseProgressData[];
  loading: boolean;
  exercisesWithData: Set<string>;
  refreshData: () => void;
}

export function useTrainingStats({
  exercises,
  trainingDateRange,
  selectedExerciseId,
  initialExercisesWithData = [],
}: UseTrainingStatsOptions): UseTrainingStatsReturn {
  const { userId } = useAuthSession();
  const [exerciseData, setExerciseData] = useState<ExerciseProgressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exercisesWithData, setExercisesWithData] = useState<Set<string>>(
    () => new Set(initialExercisesWithData)
  );

  const updateExercisesWithData = useCallback((exerciseIds: string[]) => {
    if (exerciseIds.length === 0) return;

    setExercisesWithData((prev) => {
      const updated = new Set(prev);
      let hasChanges = false;
      exerciseIds.forEach((id) => {
        if (!updated.has(id)) {
          updated.add(id);
          hasChanges = true;
        }
      });
      return hasChanges ? updated : prev;
    });
  }, []);

  // マウント時にローカルストレージから記録がある種目IDを読み込んでマージ
  useEffect(() => {
    if (typeof window !== "undefined") {
      const localIds = getExercisesWithDataFromStorage();
      if (localIds.size > 0) {
        updateExercisesWithData(Array.from(localIds));
      }
    }
  }, [updateExercisesWithData]);

  const fetchBig3Data = useCallback(async () => {
    if (exercises.length === 0) return;

    setLoading(true);

    try {
      const useDbOnly = shouldUseDbOnly(userId);

      // Big3種目のIDを取得
      const big3Exercises = exercises.filter((ex) => ex.isBig3);
      const { benchPressId, squatId, deadliftId } =
        identifyBig3Exercises(big3Exercises);

      // DBデータを取得 (userIdがある場合のみ)
      let dbBenchPress: ExerciseProgressData[] = [];
      let dbSquat: ExerciseProgressData[] = [];
      let dbDeadlift: ExerciseProgressData[] = [];

      if (userId) {
        const dbResult = await getBig3ProgressData(userId, {
          preset: trainingDateRange,
        });
        if (dbResult.success && dbResult.data) {
          dbBenchPress = dbResult.data.benchPress;
          dbSquat = dbResult.data.squat;
          dbDeadlift = dbResult.data.deadlift;
        }
      }

      let finalData: Big3ProgressData;

      if (useDbOnly) {
        finalData = {
          benchPress: dbBenchPress,
          squat: dbSquat,
          deadlift: dbDeadlift,
        };
      } else {
        // ローカルストレージとマージ
        const storageData = getBig3ProgressDataFromStorage({
          preset: trainingDateRange,
          big3ExerciseIds: {
            benchPressId,
            squatId,
            deadliftId,
          },
        });

        finalData = {
          benchPress: mergeProgressData(dbBenchPress, storageData.benchPress),
          squat: mergeProgressData(dbSquat, storageData.squat),
          deadlift: mergeProgressData(dbDeadlift, storageData.deadlift),
        };
      }

      const exerciseIds: string[] = [];
      if (finalData.benchPress.length > 0 && benchPressId) {
        exerciseIds.push(benchPressId);
      }
      if (finalData.squat.length > 0 && squatId) {
        exerciseIds.push(squatId);
      }
      if (finalData.deadlift.length > 0 && deadliftId) {
        exerciseIds.push(deadliftId);
      }
      updateExercisesWithData(exerciseIds);
    } finally {
      setLoading(false);
    }
  }, [trainingDateRange, exercises, updateExercisesWithData, userId]);

  const fetchExerciseData = useCallback(async () => {
    if (!selectedExerciseId) {
      setExerciseData([]);
      return;
    }

    setLoading(true);

    try {
      const useDbOnly = shouldUseDbOnly(userId);

      // DBデータを取得 (userIdがある場合のみ)
      let dbData: ExerciseProgressData[] = [];

      if (userId) {
        const dbResult = await getExerciseProgressData(userId, {
          exerciseId: selectedExerciseId,
          preset: trainingDateRange,
        });
        if (dbResult.success && dbResult.data) {
          dbData = dbResult.data;
        }
      }

      let finalData: typeof dbData;

      if (useDbOnly) {
        finalData = dbData;
      } else {
        const storageData = getExerciseProgressDataFromStorage({
          exerciseId: selectedExerciseId,
          preset: trainingDateRange,
        });
        finalData = mergeProgressData(dbData, storageData);
      }

      if (finalData.length > 0) {
        updateExercisesWithData([selectedExerciseId]);
      }

      setExerciseData(finalData);
    } finally {
      setLoading(false);
    }
  }, [selectedExerciseId, trainingDateRange, updateExercisesWithData, userId]);

  const refreshData = useCallback(() => {
    if (exercises.length === 0) return;
    fetchBig3Data();
    if (selectedExerciseId) {
      fetchExerciseData();
    }
  }, [exercises.length, fetchBig3Data, fetchExerciseData, selectedExerciseId]);

  useEffect(() => {
    if (exercises.length > 0) {
      fetchBig3Data();
    }
  }, [fetchBig3Data, exercises.length]);

  useEffect(() => {
    fetchExerciseData();
  }, [fetchExerciseData]);

  useEffect(() => {
    const handleRecordUpdate = () => {
      refreshData();
    };

    window.addEventListener("workout-record-updated", handleRecordUpdate);
    return () => {
      window.removeEventListener("workout-record-updated", handleRecordUpdate);
    };
  }, [refreshData]);

  return {
    exerciseData,
    loading,
    exercisesWithData,
    refreshData,
  };
}
