"use server";

import { db } from "../../../db";
import { sets, cardioRecords } from "../../../db/schemas/app";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";
import type { SetRecord, CardioRecord } from "@/types/workout";

/**
 * セッションIDでそのセッションの全種目とセット記録を取得する
 * @param sessionId ワークアウトセッションID
 * @returns 種目ごとのセット記録と有酸素記録
 */
export async function getSessionDetails(sessionId: string): Promise<{
  success: boolean;
  error?: string;
  data?: {
    workoutExercises: Array<{
      exerciseId: string;
      sets: SetRecord[];
    }>;
    cardioExercises: Array<{
      exerciseId: string;
      records: CardioRecord[];
    }>;
  };
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    // セット記録を取得
    const setsData = await db
      .select()
      .from(sets)
      .where(eq(sets.sessionId, sessionId))
      .orderBy(sets.exerciseId, sets.setOrder);

    // 有酸素記録を取得
    const cardioData = await db
      .select()
      .from(cardioRecords)
      .where(eq(cardioRecords.sessionId, sessionId))
      .orderBy(cardioRecords.exerciseId, cardioRecords.createdAt);

    // 種目ごとにグループ化
    const workoutExercisesMap = new Map<string, SetRecord[]>();
    setsData.forEach((set) => {
      const setsList = workoutExercisesMap.get(set.exerciseId) || [];
      setsList.push({
        id: set.id,
        setOrder: set.setOrder,
        weight: parseFloat(set.weight),
        reps: set.reps,
        rpe: set.rpe ? parseFloat(set.rpe) : null,
        isWarmup: set.isWarmup,
        restSeconds: set.restSeconds ?? null,
        notes: set.notes ?? null,
        failure: set.failure ?? undefined,
        duration: null,
      });
      workoutExercisesMap.set(set.exerciseId, setsList);
    });

    const cardioExercisesMap = new Map<string, CardioRecord[]>();
    cardioData.forEach((record) => {
      const recordsList = cardioExercisesMap.get(record.exerciseId) || [];
      recordsList.push({
        id: record.id,
        duration: record.duration,
        distance: record.distance ? parseFloat(record.distance) : null,
        speed: record.speed ? parseFloat(record.speed) : null,
        calories: record.calories ?? null,
        heartRate: record.heartRate ?? null,
        incline: record.incline ? parseFloat(record.incline) : null,
        notes: record.notes ?? null,
        date: new Date(), // セッションの日付を使用する必要があるが、ここでは現在時刻を設定
      });
      cardioExercisesMap.set(record.exerciseId, recordsList);
    });

    return {
      success: true,
      data: {
        workoutExercises: Array.from(workoutExercisesMap.entries()).map(
          ([exerciseId, sets]) => ({
            exerciseId,
            sets,
          })
        ),
        cardioExercises: Array.from(cardioExercisesMap.entries()).map(
          ([exerciseId, records]) => ({
            exerciseId,
            records,
          })
        ),
      },
    };
  } catch (error) {
    console.error("セッション詳細取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "セッション詳細の取得に失敗しました",
    };
  }
}

