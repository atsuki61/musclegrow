"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DateRangeSelector } from "./date-range-selector";
import { BodyPartSelector } from "./body-part-selector";
import { ExerciseSelector } from "./exercise-selector";
import { ProfileChart } from "./profile-chart";
import { Big3Chart } from "./big3-chart";
import { ExerciseChart } from "./exercise-chart";
import { HorizontalNav } from "./horizontal-nav";
import { ChartLoading } from "./chart-loading";
import {
  getProfileHistory,
  getBig3ProgressData,
  getExerciseProgressData,
} from "@/lib/actions/stats";
import { getExercises } from "@/lib/actions/exercises";
import { getBig3ProgressDataFromStorage } from "@/lib/local-storage-big3-progress";
import {
  getExerciseProgressDataFromStorage,
  getExercisesWithDataFromStorage,
} from "@/lib/local-storage-exercise-progress";
import { identifyBig3Exercises, mergeProgressData } from "@/lib/utils/stats";
import type {
  DateRangePreset,
  ProfileChartType,
  ProfileHistoryData,
  Big3ProgressData,
  ExerciseProgressData,
} from "@/types/stats";
import type { Exercise, BodyPart } from "@/types/workout";

const PROFILE_CHART_TYPES: { value: ProfileChartType; label: string }[] = [
  { value: "weight", label: "体重" },
  { value: "bodyFat", label: "体脂肪率" },
  { value: "muscleMass", label: "筋肉量" },
  { value: "bmi", label: "BMI" },
];

/**
 * データなしメッセージコンポーネント
 */
function EmptyStateMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
      <div
        className="flex flex-col items-center justify-center h-[280px]"
        style={{ color: "#6B7280" }}
      >
        <p className="text-sm">{title}</p>
        <p className="text-xs mt-1">{description}</p>
      </div>
    </div>
  );
}

/**
 * グラフページコンポーネント
 */
export function StatsPage() {
  // タブ状態
  const [activeTab, setActiveTab] = useState<"profile" | "training">("profile");

  // プロフィールタブの状態
  const [profileDateRange, setProfileDateRange] =
    useState<DateRangePreset>("month");
  const [profileChartType, setProfileChartType] =
    useState<ProfileChartType>("weight");
  const [profileHistory, setProfileHistory] = useState<ProfileHistoryData[]>(
    []
  );
  const [profileLoading, setProfileLoading] = useState(false);

  // トレーニングタブの状態
  const [trainingDateRange, setTrainingDateRange] =
    useState<DateRangePreset>("month");
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart>("all");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesWithData, setExercisesWithData] = useState<Set<string>>(
    new Set()
  );
  const [big3Data, setBig3Data] = useState<Big3ProgressData>({
    benchPress: [],
    squat: [],
    deadlift: [],
  });
  const [exerciseData, setExerciseData] = useState<ExerciseProgressData[]>([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  // 種目一覧を取得
  useEffect(() => {
    async function fetchExercises() {
      const result = await getExercises();
      if (result.success && result.data) {
        setExercises(result.data);

        // ローカルストレージから記録がある種目IDを取得
        const exercisesWithDataFromStorage = getExercisesWithDataFromStorage();
        setExercisesWithData(exercisesWithDataFromStorage);

        // Big3種目を初期選択（データがある場合のみ）
        const big3Exercise = result.data.find(
          (ex) => ex.isBig3 && exercisesWithDataFromStorage.has(ex.id)
        );
        if (big3Exercise) {
          setSelectedExerciseId(big3Exercise.id);
        } else {
          // Big3にデータがない場合、データがある最初の種目を選択
          const firstExerciseWithData = result.data.find((ex) =>
            exercisesWithDataFromStorage.has(ex.id)
          );
          if (firstExerciseWithData) {
            setSelectedExerciseId(firstExerciseWithData.id);
          }
        }
      }
    }
    fetchExercises();
  }, []);

  // プロフィール履歴を取得
  useEffect(() => {
    async function fetchProfileHistory() {
      setProfileLoading(true);
      const result = await getProfileHistory({ preset: profileDateRange });
      if (result.success && result.data) {
        setProfileHistory(result.data);
      }
      setProfileLoading(false);
    }
    fetchProfileHistory();
  }, [profileDateRange]);

  // Big3データを取得する関数（再利用可能）
  const fetchBig3Data = useCallback(async () => {
    if (exercises.length === 0) return;

    setTrainingLoading(true);

    // データベースから取得
    const dbResult = await getBig3ProgressData({ preset: trainingDateRange });

    // Big3種目のIDを取得（isBig3フラグで判定）
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
    const newExerciseIds = new Set<string>();
    if (mergedData.benchPress.length > 0 && benchPressId) {
      newExerciseIds.add(benchPressId);
    }
    if (mergedData.squat.length > 0 && squatId) {
      newExerciseIds.add(squatId);
    }
    if (mergedData.deadlift.length > 0 && deadliftId) {
      newExerciseIds.add(deadliftId);
    }

    // 変更がある場合のみ更新（関数型更新で無限ループを防止）
    if (newExerciseIds.size > 0) {
      setExercisesWithData((prev) => {
        const updated = new Set(prev);
        let hasChanges = false;
        newExerciseIds.forEach((id) => {
          if (!updated.has(id)) {
            updated.add(id);
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });
    }

    // プロフィールと同じく、全ての記録日をそのまま表示
    setBig3Data(mergedData);

    setTrainingLoading(false);
  }, [trainingDateRange, exercises]);

  // Big3データを取得（初期読み込みと期間変更時）
  useEffect(() => {
    if (exercises.length > 0) {
      fetchBig3Data();
    }
  }, [fetchBig3Data, exercises]);

  // 記録更新イベントをリッスンして再取得
  useEffect(() => {
    const handleRecordUpdate = () => {
      if (exercises.length > 0) {
        fetchBig3Data();
      }
    };

    window.addEventListener("workout-record-updated", handleRecordUpdate);
    return () => {
      window.removeEventListener("workout-record-updated", handleRecordUpdate);
    };
  }, [fetchBig3Data, exercises]);

  // 種目別データを取得する関数（再利用可能）
  const fetchExerciseData = useCallback(async () => {
    if (!selectedExerciseId) {
      setExerciseData([]);
      return;
    }

    // Big3タブ選択時のみスキップ（Big3グラフを表示）
    if (selectedBodyPart === "big3") {
      setExerciseData([]);
      return;
    }

    setTrainingLoading(true);

    // データベースから取得
    const dbResult = await getExerciseProgressData({
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

    // データがある場合、exercisesWithDataに追加（関数型更新で無限ループを防止）
    if (mergedData.length > 0) {
      setExercisesWithData((prev) => {
        if (prev.has(selectedExerciseId)) return prev;
        const updated = new Set(prev);
        updated.add(selectedExerciseId);
        return updated;
      });
    }

    // プロフィールと同じく、全ての記録日をそのまま表示
    setExerciseData(mergedData);
    setTrainingLoading(false);
  }, [selectedExerciseId, selectedBodyPart, trainingDateRange]);

  // 種目別データを取得（初期読み込みと選択変更時）
  useEffect(() => {
    fetchExerciseData();
  }, [fetchExerciseData]);

  // 記録更新イベントをリッスンして再取得
  useEffect(() => {
    const handleRecordUpdate = () => {
      fetchExerciseData();
    };

    window.addEventListener("workout-record-updated", handleRecordUpdate);
    return () => {
      window.removeEventListener("workout-record-updated", handleRecordUpdate);
    };
  }, [fetchExerciseData]);

  // 選択された種目を取得
  const selectedExercise = exercises.find((ex) => ex.id === selectedExerciseId);

  // Big3タブ選択時のみBig3グラフを表示
  // 個別のBig3種目を選択した場合は、ExerciseChartで単独表示（オレンジ色）
  const isBig3Selected = selectedBodyPart === "big3";

  // データの有無をチェック
  const hasBig3Data =
    big3Data.benchPress.length > 0 ||
    big3Data.squat.length > 0 ||
    big3Data.deadlift.length > 0;
  const hasExerciseData = exerciseData.length > 0;

  return (
    <div className="container mx-auto px-4 py-4 space-y-4 pb-20">
      <h1 className="text-2xl font-bold">グラフ</h1>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">
            プロフィール
          </TabsTrigger>
          <TabsTrigger value="training" className="flex-1">
            トレーニング
          </TabsTrigger>
        </TabsList>

        {/* プロフィールタブ */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <DateRangeSelector
            value={profileDateRange}
            onChange={setProfileDateRange}
          />

          {/* グラフタイプ選択 */}
          <HorizontalNav
            items={PROFILE_CHART_TYPES}
            value={profileChartType}
            onChange={setProfileChartType}
          />

          {/* プロフィールグラフ */}
          {profileLoading ? (
            <ChartLoading />
          ) : (
            <ProfileChart
              data={profileHistory}
              chartType={profileChartType}
              dataCount={profileHistory.length}
            />
          )}
        </TabsContent>

        {/* トレーニングタブ */}
        <TabsContent value="training" className="space-y-4 mt-4">
          <DateRangeSelector
            value={trainingDateRange}
            onChange={setTrainingDateRange}
          />

          <BodyPartSelector
            value={selectedBodyPart}
            onChange={setSelectedBodyPart}
          />

          {selectedBodyPart !== "big3" && (
            <ExerciseSelector
              exercises={exercises}
              selectedExerciseId={selectedExerciseId}
              selectedBodyPart={selectedBodyPart}
              exercisesWithData={exercisesWithData}
              onChange={setSelectedExerciseId}
            />
          )}

          {/* Big3グラフ */}
          {isBig3Selected && hasBig3Data && (
            <>
              {trainingLoading ? (
                <ChartLoading />
              ) : (
                <Big3Chart
                  data={big3Data}
                  dataCount={
                    big3Data.benchPress.length +
                    big3Data.squat.length +
                    big3Data.deadlift.length
                  }
                />
              )}
              {/* Big3選択時のみ色分け凡例を表示 */}
              {selectedBodyPart === "big3" && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>ベンチプレス</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>スクワット</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>デッドリフト</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 種目別グラフ */}
          {!isBig3Selected && selectedExerciseId && hasExerciseData && (
            <>
              {trainingLoading ? (
                <ChartLoading />
              ) : (
                <ExerciseChart
                  data={exerciseData}
                  exercise={selectedExercise || null}
                  dataCount={exerciseData.length}
                />
              )}
            </>
          )}

          {/* データなしメッセージ */}
          {!isBig3Selected && !selectedExerciseId && (
            <EmptyStateMessage
              title="種目を選択してください"
              description="記録がある種目から選択できます"
            />
          )}

          {!isBig3Selected && selectedExerciseId && !hasExerciseData && (
            <EmptyStateMessage
              title="この種目のデータがありません"
              description="記録を追加すると、ここにグラフが表示されます"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
