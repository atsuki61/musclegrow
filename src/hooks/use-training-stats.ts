/**
 * トレーニング統計データを管理するカスタムフック
 * 種目別データの取得・更新を統合管理
 */

import { useState, useEffect, useCallback } from "react";
import { getBig3ProgressData, getExerciseProgressData } from "@/lib/actions/stats";
import { getBig3ProgressDataFromStorage } from "@/lib/local-storage-big3-progress";
import { getExerciseProgressDataFromStorage } from "@/lib/local-storage-exercise-progress";
import { identifyBig3Exercises, mergeProgressData } from "@/lib/utils/stats";
import { useAuthSession } from "@/lib/auth-session-context";
import type {
  DateRangePreset,
  ExerciseProgressData,
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

/**
 * トレーニング統計データを管理するカスタムフック
 */
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

  /**
   * exercisesWithDataを更新する共通関数
   */
  const updateExercisesWithData = useCallback(
    (exerciseIds: string[]) => {
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
    },
    []
  );

  /**
   * Big3データを取得する関数
   */
  const fetchBig3Data = useCallback(async () => {
    if (exercises.length === 0) return;

    setLoading(true);

    try {
      // データベースから取得
      const dbResult = await getBig3ProgressData(userId, { preset: trainingDateRange });

      // Big3種目のIDを取得
      const big3Exercises = exercises.filter((ex) => ex.isBig3);
      const { benchPressId, squatId, deadliftId } =
        identifyBig3Exercises(big3Exercises);

      // ローカルストレージから取得
      const storageData = getBig3ProgressDataFromStorage({
        preset: trainingDateRange,
        big3ExerciseIds: {
          benchPressId,
          squatId,
          deadliftId,
        },
      });

      // データベースとローカルストレージのデータをマージ
      const mergedData = {
        benchPress: mergeProgressData(
          dbResult.success && dbResult.data ? dbResult.data.benchPress : [],
          storageData.benchPress
        ),
        squat: mergeProgressData(
          dbResult.success && dbResult.data ? dbResult.data.squat : [],
          storageData.squat
        ),
        deadlift: mergeProgressData(
          dbResult.success && dbResult.data ? dbResult.data.deadlift : [],
          storageData.deadlift
        ),
      };

      // データがあるBig3種目をexercisesWithDataに追加
      const exerciseIds: string[] = [];
      if (mergedData.benchPress.length > 0 && benchPressId) {
        exerciseIds.push(benchPressId);
      }
      if (mergedData.squat.length > 0 && squatId) {
        exerciseIds.push(squatId);
      }
      if (mergedData.deadlift.length > 0 && deadliftId) {
        exerciseIds.push(deadliftId);
      }
      updateExercisesWithData(exerciseIds);
    } finally {
      setLoading(false);
    }
  }, [trainingDateRange, exercises, updateExercisesWithData, userId]);

  /**
   * 種目別データを取得する関数
   */
  const fetchExerciseData = useCallback(async () => {
    if (!selectedExerciseId) {
      setExerciseData([]);
      return;
    }

    setLoading(true);

    try {
      // データベースから取得
      const dbResult = await getExerciseProgressData(userId, {
        exerciseId: selectedExerciseId,
        preset: trainingDateRange,
      });

      // ローカルストレージから取得
      const storageData = getExerciseProgressDataFromStorage({
        exerciseId: selectedExerciseId,
        preset: trainingDateRange,
      });

      // データベースとローカルストレージのデータをマージ
      const mergedData = mergeProgressData(
        dbResult.success && dbResult.data ? dbResult.data : [],
        storageData
      );

      // データがある場合、exercisesWithDataに追加
      if (mergedData.length > 0) {
        updateExercisesWithData([selectedExerciseId]);
      }

      setExerciseData(mergedData);
    } finally {
      setLoading(false);
    }
  }, [
    selectedExerciseId,
    trainingDateRange,
    updateExercisesWithData,
    userId,
  ]);

  /**
   * データを再取得する関数（外部から呼び出し可能）
   */
  const refreshData = useCallback(() => {
    if (exercises.length === 0) return;

    // Big3データを再取得（exercisesWithData更新のため）
    fetchBig3Data();

    // 種目別データも再取得（選択されている場合）
    if (selectedExerciseId) {
      fetchExerciseData();
    }
  }, [exercises.length, fetchBig3Data, fetchExerciseData, selectedExerciseId]);

  // Big3データを取得（初期読み込みと期間変更時）
  useEffect(() => {
    if (exercises.length > 0) {
      fetchBig3Data();
    }
  }, [fetchBig3Data, exercises.length]);

  // 種目別データを取得（初期読み込みと選択変更時）
  useEffect(() => {
    fetchExerciseData();
  }, [fetchExerciseData]);

  // 記録更新イベントをリッスンして再取得（統合）
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

