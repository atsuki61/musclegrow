"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  getWorkoutSessionsByDateRange,
  getSessionDetails,
  getExercises,
} from "@/lib/api";
import { BODY_PART_LABELS } from "@/lib/utils";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";

/**
 * 履歴ページコンポーネント
 * 過去のトレーニング記録を日付別に表示
 */
export function HistoryPage() {
  const [sessions, setSessions] = useState<
    Array<{
      id: string;
      date: string;
      note?: string | null;
      durationMinutes?: number | null;
    }>
  >([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<
    Record<
      string,
      {
        workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
        cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
      }
    >
  >({});

  // 期間に応じた開始日を計算
  const getStartDate = useCallback((period: "week" | "month" | "all"): Date => {
    const today = new Date();
    switch (period) {
      case "week":
        return subDays(today, 7);
      case "month":
        return subDays(today, 30);
      case "all":
        // 1年前から開始
        return subDays(today, 365);
      default:
        return subDays(today, 7);
    }
  }, []);

  // セッション一覧を取得
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = getStartDate(selectedPeriod);
      const endDate = new Date();

      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      const result = await getWorkoutSessionsByDateRange({
        startDate: startDateStr,
        endDate: endDateStr,
      });

      if (result.success && result.data) {
        setSessions(result.data);
      }
    } catch (error) {
      console.error("セッション取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, getStartDate]);

  // 種目一覧を取得
  const loadExercises = useCallback(async () => {
    try {
      const result = await getExercises();
      if (result.success && result.data) {
        setExercises(result.data);
      }
    } catch (error) {
      console.error("種目取得エラー:", error);
    }
  }, []);

  // 初回マウント時と期間変更時にデータを読み込む
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // セッション詳細を取得
  const handleSessionClick = async (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }

    setExpandedSessionId(sessionId);

    // 既に詳細を取得済みの場合はスキップ
    if (sessionDetails[sessionId]) {
      return;
    }

    try {
      const result = await getSessionDetails(sessionId);
      if (result.success && result.data) {
        setSessionDetails((prev) => ({
          ...prev,
          [sessionId]: result.data!,
        }));
      }
    } catch (error) {
      console.error("セッション詳細取得エラー:", error);
    }
  };

  // 種目IDから種目情報を取得
  const getExerciseById = (exerciseId: string): Exercise | undefined => {
    return exercises.find((e) => e.id === exerciseId);
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">履歴</h1>

      {/* 期間選択タブ */}
      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "week" | "month" | "all")} className="mb-4">
        <TabsList>
          <TabsTrigger value="week">1週間</TabsTrigger>
          <TabsTrigger value="month">1ヶ月</TabsTrigger>
          <TabsTrigger value="all">すべて</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* セッション一覧 */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          読み込み中...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          記録がありません
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const sessionDate = new Date(session.date + "T00:00:00");
            const formattedDate = format(sessionDate, "yyyy年M月d日(E)", { locale: ja });

            return (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{formattedDate}</CardTitle>
                    {session.durationMinutes && (
                      <span className="text-sm text-muted-foreground">
                        {session.durationMinutes}分
                      </span>
                    )}
                  </div>
                  {session.note && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {session.note}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => handleSessionClick(session.id)}
                    className="w-full"
                  >
                    {expandedSessionId === session.id ? "詳細を閉じる" : "詳細を表示"}
                  </Button>
                  {expandedSessionId === session.id && (
                    <div className="mt-4 space-y-4">
                      {sessionDetails[session.id] ? (
                        <>
                          {/* 筋トレ種目の記録 */}
                          {sessionDetails[session.id].workoutExercises.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold mb-2">筋トレ種目</h3>
                              <div className="space-y-3">
                                {sessionDetails[session.id].workoutExercises.map(
                                  ({ exerciseId, sets }) => {
                                    const exercise = getExerciseById(exerciseId);
                                    if (!exercise) return null;

                                    return (
                                      <div key={exerciseId} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium">{exercise.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {BODY_PART_LABELS[exercise.bodyPart]}
                                          </span>
                                        </div>
                                        <div className="space-y-1">
                                          {sets.map((set) => (
                                            <div
                                              key={set.id}
                                              className="flex items-center gap-2 text-sm"
                                            >
                                              <span className="text-muted-foreground">
                                                {set.setOrder}セット目:
                                              </span>
                                              {set.weight !== undefined && set.weight > 0 && (
                                                <span>{set.weight}kg</span>
                                              )}
                                              <span>× {set.reps}回</span>
                                              {set.rpe && (
                                                <span className="text-muted-foreground">
                                                  (RPE: {set.rpe})
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}

                          {/* 有酸素種目の記録 */}
                          {sessionDetails[session.id].cardioExercises.length > 0 && (
                            <div>
                              <Separator className="my-4" />
                              <h3 className="text-sm font-semibold mb-2">有酸素種目</h3>
                              <div className="space-y-3">
                                {sessionDetails[session.id].cardioExercises.map(
                                  ({ exerciseId, records }) => {
                                    const exercise = getExerciseById(exerciseId);
                                    if (!exercise) return null;

                                    return (
                                      <div key={exerciseId} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium">{exercise.name}</span>
                                        </div>
                                        <div className="space-y-1">
                                          {records.map((record) => (
                                            <div key={record.id} className="text-sm">
                                              <span>{record.duration}分</span>
                                              {record.distance && (
                                                <span className="ml-2">
                                                  {record.distance}km
                                                </span>
                                              )}
                                              {record.calories && (
                                                <span className="ml-2 text-muted-foreground">
                                                  {record.calories}kcal
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}

                          {sessionDetails[session.id].workoutExercises.length === 0 &&
                            sessionDetails[session.id].cardioExercises.length === 0 && (
                              <p className="text-sm text-muted-foreground">
                                記録がありません
                              </p>
                            )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          詳細を読み込み中...
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
