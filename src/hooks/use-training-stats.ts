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
import { shouldUseDbOnly } from "@/lib/data-source";
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
      // DBのみ参照すべきか判定（ログイン済み＋移行完了の場合true）
      const useDbOnly = shouldUseDbOnly(userId);

      // データベースから取得
      const dbResult = await getBig3ProgressData(userId, { preset: trainingDateRange });

      // Big3種目のIDを取得
      const big3Exercises = exercises.filter((ex) => ex.isBig3);
      const { benchPressId, squatId, deadliftId } =
        identifyBig3Exercises(big3Exercises);

      // DBデータを取得
      const dbBenchPress = dbResult.success && dbResult.data ? dbResult.data.benchPress : [];
      const dbSquat = dbResult.success && dbResult.data ? dbResult.data.squat : [];
      const dbDeadlift = dbResult.success && dbResult.data ? dbResult.data.deadlift : [];

      let finalData: {
        benchPress: typeof dbBenchPress;
        squat: typeof dbSquat;
        deadlift: typeof dbDeadlift;
      };

      if (useDbOnly) {
        // DBのみモード: ローカルストレージを参照しない（パフォーマンス向上）
        finalData = {
          benchPress: dbBenchPress,
          squat: dbSquat,
          deadlift: dbDeadlift,
        };
      } else {
        // 従来モード: ローカルストレージとマージ
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

      // データがあるBig3種目をexercisesWithDataに追加
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
      // DBのみ参照すべきか判定（ログイン済み＋移行完了の場合true）
      const useDbOnly = shouldUseDbOnly(userId);

      // データベースから取得
      const dbResult = await getExerciseProgressData(userId, {
        exerciseId: selectedExerciseId,
        preset: trainingDateRange,
      });

      const dbData = dbResult.success && dbResult.data ? dbResult.data : [];

      let finalData: typeof dbData;

      if (useDbOnly) {
        // DBのみモード: ローカルストレージを参照しない（パフォーマンス向上）
        finalData = dbData;
      } else {
        // 従来モード: ローカルストレージとマージ
        const storageData = getExerciseProgressDataFromStorage({
          exerciseId: selectedExerciseId,
          preset: trainingDateRange,
        });
        finalData = mergeProgressData(dbData, storageData);
      }

      // データがある場合、exercisesWithDataに追加
      if (finalData.length > 0) {
        updateExercisesWithData([selectedExerciseId]);
      }

      setExerciseData(finalData);
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

