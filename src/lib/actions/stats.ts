"use server";

import { db } from "../../../db";
import {
  profileHistory,
  sets,
  workoutSessions,
  exercises,
} from "../../../db/schemas/app";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq, and, gte, sql, or, isNull } from "drizzle-orm";
import type {
  ProfileHistoryData,
  ExerciseProgressData,
  Big3ProgressData,
  DateRangePreset,
} from "@/types/stats";
import { format } from "date-fns";
import {
  getStartDate,
  extractMaxWeightUpdates,
  identifyBig3Exercises,
} from "@/lib/utils/stats";

/**
 * プロフィール履歴を取得する
 */
export async function getProfileHistory({
  preset = "month",
}: {
  preset?: DateRangePreset;
}): Promise<{
  success: boolean;
  error?: string;
  data?: ProfileHistoryData[];
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    const startDate = getStartDate(preset);

    const history = await db
      .select()
      .from(profileHistory)
      .where(
        and(
          eq(profileHistory.userId, userId),
          gte(profileHistory.recordedAt, startDate)
        )
      )
      .orderBy(profileHistory.recordedAt);

    const historyData: ProfileHistoryData[] = history.map((h) => ({
      id: h.id,
      userId: h.userId,
      height: h.height ? parseFloat(h.height) : null,
      weight: h.weight ? parseFloat(h.weight) : null,
      bodyFat: h.bodyFat ? parseFloat(h.bodyFat) : null,
      muscleMass: h.muscleMass ? parseFloat(h.muscleMass) : null,
      bmi: h.bmi ? parseFloat(h.bmi) : null,
      recordedAt: h.recordedAt.toISOString(),
    }));

    return {
      success: true,
      data: historyData,
    };
  } catch (error: unknown) {
    console.error("プロフィール履歴取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "プロフィール履歴の取得に失敗しました",
    };
  }
}

/**
 * Big3の推移データを取得する（最大重量が更新された日のみ）
 */
export async function getBig3ProgressData({
  preset = "month",
}: {
  preset?: DateRangePreset;
}): Promise<{
  success: boolean;
  error?: string;
  data?: Big3ProgressData;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    const startDate = getStartDate(preset);
    const startDateStr = format(startDate, "yyyy-MM-dd");

    // Big3種目のIDを取得（共通マスタ + ユーザー独自種目）
    const big3Exercises = await db
      .select({ id: exercises.id, name: exercises.name })
      .from(exercises)
      .where(
        and(
          eq(exercises.isBig3, true),
          or(isNull(exercises.userId), eq(exercises.userId, userId))
        )
      );

    if (big3Exercises.length === 0) {
      return {
        success: true,
        data: {
          benchPress: [],
          squat: [],
          deadlift: [],
        },
      };
    }

    // Big3種目を特定
    const { benchPressId, squatId, deadliftId } =
      identifyBig3Exercises(big3Exercises);

    const result: Big3ProgressData = {
      benchPress: [],
      squat: [],
      deadlift: [],
    };

    // 各Big3種目の最大重量更新日を取得
    const exerciseMap = [
      { id: benchPressId, key: "benchPress" as const },
      { id: squatId, key: "squat" as const },
      { id: deadliftId, key: "deadlift" as const },
    ].filter((item): item is { id: string; key: keyof Big3ProgressData } =>
      Boolean(item.id)
    );

    for (const { id: exerciseId, key } of exerciseMap) {
      const maxWeightByDate = await db
        .select({
          date: workoutSessions.date,
          maxWeight: sql<number>`MAX(${sets.weight}::numeric)::float`,
        })
        .from(sets)
        .innerJoin(workoutSessions, eq(sets.sessionId, workoutSessions.id))
        .where(
          and(
            eq(workoutSessions.userId, userId),
            eq(sets.exerciseId, exerciseId),
            gte(workoutSessions.date, startDateStr),
            eq(sets.isWarmup, false) // ウォームアップセットを除外
          )
        )
        .groupBy(workoutSessions.date)
        .orderBy(workoutSessions.date);

      // 最大重量が更新された日のみを抽出
      result[key] = extractMaxWeightUpdates(maxWeightByDate);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    console.error("Big3推移データ取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Big3推移データの取得に失敗しました",
    };
  }
}

/**
 * 種目別の推移データを取得する（最大重量が更新された日のみ）
 */
export async function getExerciseProgressData({
  exerciseId,
  preset = "month",
}: {
  exerciseId: string;
  preset?: DateRangePreset;
}): Promise<{
  success: boolean;
  error?: string;
  data?: ExerciseProgressData[];
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    const startDate = getStartDate(preset);

    // 日付ごとの最大重量を取得
    const maxWeightByDate = await db
      .select({
        date: workoutSessions.date,
        maxWeight: sql<number>`MAX(${sets.weight}::numeric)::float`,
      })
      .from(sets)
      .innerJoin(workoutSessions, eq(sets.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(sets.exerciseId, exerciseId),
          gte(workoutSessions.date, format(startDate, "yyyy-MM-dd")),
          eq(sets.isWarmup, false) // ウォームアップセットを除外
        )
      )
      .groupBy(workoutSessions.date)
      .orderBy(workoutSessions.date);

    // 最大重量が更新された日のみを抽出
    const progressData = extractMaxWeightUpdates(maxWeightByDate);

    return {
      success: true,
      data: progressData,
    };
  } catch (error: unknown) {
    console.error("種目推移データ取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "種目推移データの取得に失敗しました",
    };
  }
}
