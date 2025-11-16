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
import { getExerciseProgressDataFromStorage } from "@/lib/local-storage-exercise-progress";
import { extractMaxWeightUpdates } from "@/lib/utils/stats";
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
        // Big3種目を初期選択
        const big3Exercise = result.data.find((ex) => ex.isBig3);
        if (big3Exercise) {
          setSelectedExerciseId(big3Exercise.id);
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
    
    // Big3種目のIDを取得
    const big3Exercises = exercises.filter((ex) => ex.isBig3);
    const benchPressId = big3Exercises.find(
      (e) => e.name.includes("ベンチ") || e.name.toLowerCase().includes("bench")
    )?.id;
    const squatId = big3Exercises.find(
      (e) => e.name.includes("スクワット") || e.name.toLowerCase().includes("squat")
    )?.id;
    const deadliftId = big3Exercises.find(
      (e) => e.name.includes("デッド") || e.name.toLowerCase().includes("deadlift")
    )?.id;

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
    // 同じ日付のデータがある場合、大きい方を優先
    const mergeData = (
      dbData: Array<{ date: string; maxWeight: number }>,
      storageData: Array<{ date: string; maxWeight: number }>
    ): Array<{ date: string; maxWeight: number }> => {
      const merged = new Map<string, number>();

      // データベースのデータを追加
      for (const item of dbData) {
        merged.set(item.date, item.maxWeight);
      }

      // ローカルストレージのデータを追加（大きい方を優先）
      for (const item of storageData) {
        const existing = merged.get(item.date);
        if (!existing || item.maxWeight > existing) {
          merged.set(item.date, item.maxWeight);
        }
      }

      // 日付でソート
      return Array.from(merged.entries())
        .map(([date, maxWeight]) => ({ date, maxWeight }))
        .sort((a, b) => a.date.localeCompare(b.date));
    };

    const mergedData = {
      benchPress: mergeData(
        dbResult.success && dbResult.data ? dbResult.data.benchPress : [],
        storageData.benchPress
      ),
      squat: mergeData(
        dbResult.success && dbResult.data ? dbResult.data.squat : [],
        storageData.squat
      ),
      deadlift: mergeData(
        dbResult.success && dbResult.data ? dbResult.data.deadlift : [],
        storageData.deadlift
      ),
    };

    // 最大重量が更新された日のみを抽出（マージ後のデータに対して）
    setBig3Data({
      benchPress: extractMaxWeightUpdates(mergedData.benchPress),
      squat: extractMaxWeightUpdates(mergedData.squat),
      deadlift: extractMaxWeightUpdates(mergedData.deadlift),
    });

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

    // Big3種目またはBig3フィルターの場合はスキップ（Big3グラフを表示）
    const selectedExercise = exercises.find(
      (ex) => ex.id === selectedExerciseId
    );
    if (selectedBodyPart === "big3" || selectedExercise?.isBig3) {
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
    // 同じ日付のデータがある場合、大きい方を優先
    const merged = new Map<string, number>();

    // データベースのデータを追加
    if (dbResult.success && dbResult.data) {
      for (const item of dbResult.data) {
        merged.set(item.date, item.maxWeight);
      }
    }

    // ローカルストレージのデータを追加（大きい方を優先）
    for (const item of storageData) {
      const existing = merged.get(item.date);
      if (!existing || item.maxWeight > existing) {
        merged.set(item.date, item.maxWeight);
      }
    }

    // 日付でソート
    const mergedData = Array.from(merged.entries())
      .map(([date, maxWeight]) => ({ date, maxWeight }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 最大重量が更新された日のみを抽出
    setExerciseData(extractMaxWeightUpdates(mergedData));
    setTrainingLoading(false);
  }, [selectedExerciseId, selectedBodyPart, trainingDateRange, exercises]);

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

  // 選択された種目がBig3かどうかを判定
  const selectedExercise = exercises.find((ex) => ex.id === selectedExerciseId);
  const isBig3Selected =
    selectedBodyPart === "big3" ||
    selectedExercise?.isBig3 ||
    selectedExerciseId === null ||
    Boolean(
      selectedExercise &&
        (selectedExercise.name.includes("ベンチ") ||
          selectedExercise.name.includes("スクワット") ||
          selectedExercise.name.includes("デッド"))
    );

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
              onChange={setSelectedExerciseId}
            />
          )}

          {/* Big3グラフ */}
          {isBig3Selected && (
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedBodyPart === "big3"
                    ? "Big3 推移"
                    : "トレーニング推移"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  最大重量が更新された日のみ表示
                </p>
              </div>
              {trainingLoading ? (
                <ChartLoading />
              ) : (
                <Big3Chart data={big3Data} />
              )}
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
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ※ 最大重量が更新された日のみ表示
              </p>
            </div>
          )}

          {/* 種目別グラフ */}
          {!isBig3Selected && selectedExerciseId && (
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedExercise?.name || "種目別"} の推移
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  最大重量が更新された日のみ表示
                </p>
              </div>
              {trainingLoading ? (
                <ChartLoading />
              ) : (
                <ExerciseChart
                  data={exerciseData}
                  exercise={selectedExercise || null}
                />
              )}
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ※ 最大重量が更新された日のみ表示
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
