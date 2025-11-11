"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Big3Progress } from "./big3-progress";
import { RecordButton } from "./record-button";
import { getBig3MaxWeights } from "@/lib/api";
import { calculateMaxWeights } from "@/lib/max-weight";
import { getExercises } from "@/lib/api";
import { mockInitialExercises } from "@/lib/mock-exercises";
import type { Exercise } from "@/types/workout";

// Big3種目の目標重量（デフォルト値、将来的にはプロフィール設定で管理）
const DEFAULT_TARGETS = {
  benchPress: 100,
  squat: 120,
  deadlift: 140,
};

/**
 * Big3種目を検索する
 */
function findBig3Exercises(exercises: Exercise[]) {
  return {
    benchPress: exercises.find((ex) => ex.name === "ベンチプレス" && ex.isBig3),
    squat: exercises.find((ex) => ex.name === "スクワット" && ex.isBig3),
    deadlift: exercises.find((ex) => ex.name === "デッドリフト" && ex.isBig3),
  };
}

/**
 * ローカルストレージから最大重量を取得する
 * 種目IDが一致しない場合でも、ローカルストレージの全ての種目IDから最大重量を取得
 */
function getLocalMaxWeight(
  exerciseId: string | undefined,
  localMaxWeights: Record<string, number>
): number {
  if (!exerciseId) return 0;
  return localMaxWeights[exerciseId] || 0;
}

/**
 * Big3種目のIDを取得する（優先順位: DB → 種目一覧 → モックデータ）
 */
function getBig3ExerciseIds(
  dbResult: {
    success: boolean;
    data?: {
      benchPress: { exerciseId: string };
      squat: { exerciseId: string };
      deadlift: { exerciseId: string };
    };
  },
  big3Exercises: {
    benchPress?: Exercise;
    squat?: Exercise;
    deadlift?: Exercise;
  },
  mockBig3Exercises: {
    benchPress?: Exercise;
    squat?: Exercise;
    deadlift?: Exercise;
  }
): {
  benchPress: string | undefined;
  squat: string | undefined;
  deadlift: string | undefined;
} {
  const getExerciseId = (
    dbId: string | undefined,
    exercise: Exercise | undefined,
    mockExercise: Exercise | undefined
  ): string | undefined => {
    if (dbId && dbId !== "") return dbId;
    return exercise?.id || mockExercise?.id;
  };

  return {
    benchPress: getExerciseId(
      dbResult.data?.benchPress.exerciseId,
      big3Exercises.benchPress,
      mockBig3Exercises.benchPress
    ),
    squat: getExerciseId(
      dbResult.data?.squat.exerciseId,
      big3Exercises.squat,
      mockBig3Exercises.squat
    ),
    deadlift: getExerciseId(
      dbResult.data?.deadlift.exerciseId,
      big3Exercises.deadlift,
      mockBig3Exercises.deadlift
    ),
  };
}

/**
 * Big3データを生成する
 */
function createBig3Data(weights: {
  benchPress: number;
  squat: number;
  deadlift: number;
}) {
  return {
    benchPress: {
      name: "ベンチプレス",
      current: weights.benchPress,
      target: DEFAULT_TARGETS.benchPress,
      color: "bg-red-500",
    },
    squat: {
      name: "スクワット",
      current: weights.squat,
      target: DEFAULT_TARGETS.squat,
      color: "bg-green-500",
    },
    deadlift: {
      name: "デッドリフト",
      current: weights.deadlift,
      target: DEFAULT_TARGETS.deadlift,
      color: "bg-blue-500",
    },
  };
}

export function HomePage() {
  const pathname = usePathname();
  const [big3Data, setBig3Data] = useState({
    benchPress: {
      name: "ベンチプレス",
      current: 0,
      target: DEFAULT_TARGETS.benchPress,
      color: "bg-red-500",
    },
    squat: {
      name: "スクワット",
      current: 0,
      target: DEFAULT_TARGETS.squat,
      color: "bg-green-500",
    },
    deadlift: {
      name: "デッドリフト",
      current: 0,
      target: DEFAULT_TARGETS.deadlift,
      color: "bg-blue-500",
    },
  });

  // Big3データを読み込む関数
  const loadBig3Data = useCallback(async () => {
    try {
      // データベースからBig3の最大重量を取得
      const dbResult = await getBig3MaxWeights();
      // ローカルストレージからも最大重量を取得（オフライン対応）
      const localMaxWeights = calculateMaxWeights();

      // 種目一覧を取得してBig3種目のIDを特定
      // データベース接続エラー時はモックデータを使用
      let exercises: Exercise[] = [];
      try {
        const exercisesResult = await getExercises();
        exercises = exercisesResult.data || [];
      } catch {
        // getExercises()が失敗した場合はモックデータを使用
        exercises = mockInitialExercises;
      }

      // モックデータから必ず種目IDを取得（フォールバック用）
      const mockBig3Exercises = findBig3Exercises(mockInitialExercises);

      // データベースから取得した種目があれば使用、なければモックデータから取得
      const big3Exercises = findBig3Exercises(exercises);

      // 種目IDの取得優先順位:
      // 1. データベースから取得した種目ID（dbResult.data、空文字列でない場合）
      // 2. 種目一覧から検索したID（big3Exercises）
      // 3. モックデータから取得（mockBig3Exercises）
      const exerciseIds = getBig3ExerciseIds(
        dbResult,
        big3Exercises,
        mockBig3Exercises
      );

      // デバッグ情報（開発環境のみ）
      if (process.env.NODE_ENV === "development") {
        console.log("Big3データ取得結果:", {
          dbResult: dbResult.success ? "成功" : "失敗",
          dbWeights: dbResult.data,
          localMaxWeights,
          exerciseIds,
          big3Exercises: {
            benchPress: big3Exercises.benchPress?.id,
            squat: big3Exercises.squat?.id,
            deadlift: big3Exercises.deadlift?.id,
          },
        });
      }

      // データベースとローカルストレージの最大重量をマージ（データベース優先）
      const dbWeights = dbResult.data
        ? {
            benchPress: dbResult.data.benchPress.maxWeight,
            squat: dbResult.data.squat.maxWeight,
            deadlift: dbResult.data.deadlift.maxWeight,
          }
        : {
            benchPress: 0,
            squat: 0,
            deadlift: 0,
          };

      // ローカルストレージから各種目の最大重量を取得
      // 種目IDが取得できない場合でも、ローカルストレージの全ての種目IDから最大重量を取得
      const localWeights = {
        benchPress: getLocalMaxWeight(exerciseIds.benchPress, localMaxWeights),
        squat: getLocalMaxWeight(exerciseIds.squat, localMaxWeights),
        deadlift: getLocalMaxWeight(exerciseIds.deadlift, localMaxWeights),
      };

      // デバッグ情報（開発環境のみ）
      if (process.env.NODE_ENV === "development") {
        console.log("ローカルストレージから取得した最大重量:", {
          exerciseIds,
          localWeights,
          localMaxWeightsKeys: Object.keys(localMaxWeights),
        });
      }

      // データベースとローカルストレージの最大値を比較（大きい方を採用）
      const finalWeights = {
        benchPress: Math.max(dbWeights.benchPress, localWeights.benchPress),
        squat: Math.max(dbWeights.squat, localWeights.squat),
        deadlift: Math.max(dbWeights.deadlift, localWeights.deadlift),
      };

      const newData = createBig3Data(finalWeights);

      // デバッグ情報（開発環境のみ）
      if (process.env.NODE_ENV === "development") {
        console.log("生成されたBig3データ:", newData);
      }

      setBig3Data(newData);
    } catch (error) {
      // エラー時はローカルストレージのみを使用
      if (process.env.NODE_ENV === "development") {
        console.warn("Big3データ取得エラー:", error);
      }

      const localMaxWeights = calculateMaxWeights();

      // データベース接続エラー時は、getExercises()も失敗する可能性があるため、
      // モックデータから直接種目IDを取得
      const mockBig3Exercises = findBig3Exercises(mockInitialExercises);
      let exerciseIds: {
        benchPress: string | undefined;
        squat: string | undefined;
        deadlift: string | undefined;
      };

      try {
        const exercisesResult = await getExercises();
        const exercises = exercisesResult.data || [];
        const big3Exercises = findBig3Exercises(exercises);
        exerciseIds = getBig3ExerciseIds(
          { success: false },
          big3Exercises,
          mockBig3Exercises
        );
      } catch {
        // getExercises()も失敗した場合は、モックデータから種目IDを取得
        exerciseIds = {
          benchPress: mockBig3Exercises.benchPress?.id,
          squat: mockBig3Exercises.squat?.id,
          deadlift: mockBig3Exercises.deadlift?.id,
        };

        // デバッグ情報（開発環境のみ）
        if (process.env.NODE_ENV === "development") {
          console.log("モックデータから取得した種目ID:", {
            mockBig3Exercises,
            exerciseIds,
            mockInitialExercises: mockInitialExercises
              .filter((ex) => ex.isBig3)
              .map((ex) => ({ name: ex.name, id: ex.id })),
          });
        }
      }

      // ローカルストレージから最大重量を取得
      // 種目IDが取得できない場合は、ローカルストレージの全ての種目IDから最大値を取得
      const allLocalWeights = Object.values(localMaxWeights);
      const maxLocalWeight =
        allLocalWeights.length > 0 ? Math.max(...allLocalWeights) : 0;

      // 種目IDが取得できた場合はその種目の最大重量を使用
      // 取得できない場合は、ローカルストレージの全ての種目から最大値を取得
      const localWeights = {
        benchPress: exerciseIds.benchPress
          ? localMaxWeights[exerciseIds.benchPress] || 0
          : maxLocalWeight, // 種目IDが取得できない場合は最大値を使用
        squat: exerciseIds.squat
          ? localMaxWeights[exerciseIds.squat] || 0
          : maxLocalWeight,
        deadlift: exerciseIds.deadlift
          ? localMaxWeights[exerciseIds.deadlift] || 0
          : maxLocalWeight,
      };

      // デバッグ情報（開発環境のみ）
      if (process.env.NODE_ENV === "development") {
        console.log("エラー時のローカルストレージデータ:", {
          exerciseIds,
          localMaxWeights,
          localWeights,
          allLocalWeights,
          maxLocalWeight,
        });
      }

      const newData = createBig3Data(localWeights);
      setBig3Data(newData);
    }
  }, []);

  // 初回マウント時とホームページに戻ってきたときにデータを読み込む
  useEffect(() => {
    if (pathname === "/") {
      loadBig3Data();
    }
  }, [pathname, loadBig3Data]);

  // ページの可視性変更を監視（記録ページから戻ってきたときにも更新）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && pathname === "/") {
        loadBig3Data();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, loadBig3Data]);

  return (
    <div className="container mx-auto px-4 pt-0 pb-4 space-y-6">
      <Big3Progress
        benchPress={big3Data.benchPress}
        squat={big3Data.squat}
        deadlift={big3Data.deadlift}
      />
      <RecordButton />
    </div>
  );
}
