"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DateRangeSelector } from "./date-range-selector";
import { BodyPartSelector } from "./body-part-selector";
import { ExerciseSelector } from "./exercise-selector";
import { HorizontalNav } from "./horizontal-nav";
import { ChartLoading } from "./chart-loading";
import { getProfileHistory } from "@/lib/actions/stats";
import { getExercisesWithDataFromStorage } from "@/lib/local-storage-exercise-progress";
import { useTrainingStats } from "@/hooks/use-training-stats";
import { useAuthSession } from "@/lib/auth-session-context";
import type {
  DateRangePreset,
  ProfileChartType,
  ProfileHistoryData,
} from "@/types/stats";
import type { Exercise, BodyPart } from "@/types/workout";
import dynamic from "next/dynamic";

// ダイナミックインポートは維持しつつ、ローディング表示をスケルトンに変更しても良いですが、
// ここではチラつき防止のために一旦そのままにします。
const ProfileChart = dynamic(
  () => import("./profile-chart").then((mod) => mod.ProfileChart),
  { loading: () => <ChartLoading /> }
);

const ExerciseChart = dynamic(
  () => import("./exercise-chart").then((mod) => mod.ExerciseChart),
  { loading: () => <ChartLoading /> }
);

const PROFILE_CHART_TYPES: { value: ProfileChartType; label: string }[] = [
  { value: "weight", label: "体重" },
  { value: "bodyFat", label: "体脂肪率" },
  { value: "muscleMass", label: "筋肉量" },
  { value: "bmi", label: "BMI" },
];

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

interface StatsPageProps {
  initialProfileHistory: ProfileHistoryData[];
  initialProfileDateRange: DateRangePreset;
  initialTrainingDateRange: DateRangePreset;
  initialExercises: Exercise[];
  initialExercisesWithData: string[];
}

export function StatsPage({
  initialProfileHistory,
  initialProfileDateRange,
  initialTrainingDateRange,
  initialExercises,
  initialExercisesWithData,
}: StatsPageProps) {
  const { userId } = useAuthSession();
  const [isPending, startTransition] = useTransition(); // トランジション追加

  // タブ状態
  const [activeTab, setActiveTab] = useState<"profile" | "training">("profile");

  // プロフィールタブの状態
  const [profileDateRange, setProfileDateRange] = useState<DateRangePreset>(
    initialProfileDateRange
  );
  const [profileChartType, setProfileChartType] =
    useState<ProfileChartType>("weight");

  const [profileHistory, setProfileHistory] = useState<ProfileHistoryData[]>(
    initialProfileHistory
  );

  // キャッシュ用のRef
  const profileCache = useRef<Record<string, ProfileHistoryData[]>>({
    [initialProfileDateRange]: initialProfileHistory,
  });

  // トレーニングタブの状態
  const [trainingDateRange, setTrainingDateRange] = useState<DateRangePreset>(
    initialTrainingDateRange
  );
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart>("all");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );
  const [exercises] = useState<Exercise[]>(initialExercises);

  const {
    exerciseData,
    loading: trainingLoading, // フック内部のローディング状態
    exercisesWithData,
  } = useTrainingStats({
    exercises,
    trainingDateRange,
    selectedExerciseId,
    initialExercisesWithData,
  });

  // プロフィール期間変更ハンドラ（キャッシュ活用 & トランジション）
  const handleProfileDateRangeChange = (range: DateRangePreset) => {
    startTransition(() => {
      setProfileDateRange(range);

      // キャッシュにあれば即座にセット
      if (profileCache.current[range]) {
        setProfileHistory(profileCache.current[range]);
      } else {
        // なければフェッチ（この間 isPending が true になるが、前のデータは表示されたまま）
        fetchProfileHistory(range);
      }
    });
  };

  async function fetchProfileHistory(range: DateRangePreset) {
    const result = await getProfileHistory(userId, { preset: range });
    if (result.success && result.data) {
      // データを更新しつつキャッシュにも保存
      setProfileHistory(result.data);
      profileCache.current[range] = result.data;
    }
  }

  // トレーニング期間変更ハンドラ
  const handleTrainingDateRangeChange = (range: DateRangePreset) => {
    startTransition(() => {
      setTrainingDateRange(range);
    });
  };

  // 初回マウント時の自動選択（変更なし）
  useEffect(() => {
    if (selectedExerciseId) return;
    const exercisesWithDataFromStorage = getExercisesWithDataFromStorage();
    const firstExerciseWithLocalData = exercises.find((ex) =>
      exercisesWithDataFromStorage.has(ex.id)
    );
    if (firstExerciseWithLocalData) {
      setSelectedExerciseId(firstExerciseWithLocalData.id);
      return;
    }
    if (initialExercisesWithData.length > 0) {
      const fallback = initialExercisesWithData.find((id) =>
        exercises.some((ex) => ex.id === id)
      );
      if (fallback) setSelectedExerciseId(fallback);
    }
  }, [exercises, initialExercisesWithData, selectedExerciseId]);

  const selectedExercise = exercises.find((ex) => ex.id === selectedExerciseId);
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
            onChange={handleProfileDateRangeChange}
          />

          <HorizontalNav
            items={PROFILE_CHART_TYPES}
            value={profileChartType}
            onChange={setProfileChartType}
          />

          {/* 
            isPending中はグラフを少し薄くする（opacity-50）ことで、
            「読み込み中」であることを伝えつつ、ガタつきを防ぐ
           */}
          <div
            className={`transition-opacity duration-300 ${
              isPending ? "opacity-50" : "opacity-100"
            }`}
          >
            <ProfileChart
              data={profileHistory}
              chartType={profileChartType}
              dataCount={profileHistory.length}
            />
          </div>
        </TabsContent>

        {/* トレーニングタブ */}
        <TabsContent value="training" className="space-y-4 mt-4">
          <DateRangeSelector
            value={trainingDateRange}
            onChange={handleTrainingDateRangeChange}
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

          <div
            className={`transition-opacity duration-300 ${
              isPending || trainingLoading ? "opacity-50" : "opacity-100"
            }`}
          >
            {selectedExerciseId && hasExerciseData ? (
              <ExerciseChart
                data={exerciseData}
                exercise={selectedExercise || null}
                dataCount={exerciseData.length}
              />
            ) : !selectedExerciseId ? (
              <EmptyStateMessage
                title="種目を選択してください"
                description="記録がある種目から選択できます"
              />
            ) : (
              <EmptyStateMessage
                title="この種目のデータがありません"
                description="記録を追加すると、ここにグラフが表示されます"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
