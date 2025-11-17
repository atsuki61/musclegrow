"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DateRangeSelector } from "./date-range-selector";
import { BodyPartSelector } from "./body-part-selector";
import { ExerciseSelector } from "./exercise-selector";
import { ProfileChart } from "./profile-chart";
import { ExerciseChart } from "./exercise-chart";
import { HorizontalNav } from "./horizontal-nav";
import { ChartLoading } from "./chart-loading";
import { getProfileHistory } from "@/lib/actions/stats";
import { getExercises } from "@/lib/actions/exercises";
import { getExercisesWithDataFromStorage } from "@/lib/local-storage-exercise-progress";
import { useTrainingStats } from "@/hooks/use-training-stats";
import type {
  DateRangePreset,
  ProfileChartType,
  ProfileHistoryData,
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

  // トレーニング統計データを管理するカスタムフック
  const {
    exerciseData,
    loading: trainingLoading,
    exercisesWithData,
  } = useTrainingStats({
    exercises,
    trainingDateRange,
    selectedExerciseId,
  });

  // 種目一覧を取得
  useEffect(() => {
    async function fetchExercises() {
      const result = await getExercises();
      if (result.success && result.data) {
        setExercises(result.data);

        // ローカルストレージから記録がある種目IDを取得
        const exercisesWithDataFromStorage = getExercisesWithDataFromStorage();

        // データがある最初の種目を選択
        const firstExerciseWithData = result.data.find((ex) =>
          exercisesWithDataFromStorage.has(ex.id)
        );
        if (firstExerciseWithData) {
          setSelectedExerciseId(firstExerciseWithData.id);
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

  // 選択された種目を取得
  const selectedExercise = exercises.find((ex) => ex.id === selectedExerciseId);

  // データの有無をチェック
  const hasExerciseData = exerciseData.length > 0;

  return (
    <div className="container mx-auto px-4 py-4 space-y-4 pb-20">
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

          <ExerciseSelector
            exercises={exercises}
            selectedExerciseId={selectedExerciseId}
            selectedBodyPart={selectedBodyPart}
            exercisesWithData={exercisesWithData}
            onChange={setSelectedExerciseId}
          />

          {/* 種目別グラフ */}
          {selectedExerciseId && hasExerciseData && (
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
          {!selectedExerciseId && (
            <EmptyStateMessage
              title="種目を選択してください"
              description="記録がある種目から選択できます"
            />
          )}

          {selectedExerciseId && !hasExerciseData && (
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
