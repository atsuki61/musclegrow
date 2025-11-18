"use server";

import { unstable_cache } from "next/cache";
import { db } from "../../../db";
import {
  profileHistory,
  sets,
  workoutSessions,
  exercises,
} from "../../../db/schemas/app";
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
const fetchProfileHistoryCached = unstable_cache(
  async (userId: string, preset: DateRangePreset) => {
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

    return history.map((h) => ({
      id: h.id,
      userId: h.userId,
      height: h.height ? parseFloat(h.height) : null,
      weight: h.weight ? parseFloat(h.weight) : null,
      bodyFat: h.bodyFat ? parseFloat(h.bodyFat) : null,
      muscleMass: h.muscleMass ? parseFloat(h.muscleMass) : null,
      bmi: h.bmi ? parseFloat(h.bmi) : null,
      recordedAt: h.recordedAt.toISOString(),
    }));
  },
  ["profile-history"],
  { tags: ["profile:history"] }
);

export async function getProfileHistory(
  userId: string,
  {
    preset = "month",
  }: {
    preset?: DateRangePreset;
  } = {}
): Promise<{
  success: boolean;
  error?: string;
  data?: ProfileHistoryData[];
}> {
  try {
    const historyData = await fetchProfileHistoryCached(userId, preset);

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
const fetchBig3ProgressCached = unstable_cache(
  async (userId: string, preset: DateRangePreset) => {
    const startDate = getStartDate(preset);
    const startDateStr = format(startDate, "yyyy-MM-dd");

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
        benchPress: [],
        squat: [],
        deadlift: [],
      };
    }

    const { benchPressId, squatId, deadliftId } =
      identifyBig3Exercises(big3Exercises);

    const result: Big3ProgressData = {
      benchPress: [],
      squat: [],
      deadlift: [],
    };

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
            eq(sets.isWarmup, false)
          )
        )
        .groupBy(workoutSessions.date)
        .orderBy(workoutSessions.date);

      result[key] = extractMaxWeightUpdates(maxWeightByDate);
    }

    return result;
  },
  ["stats-big3"],
  { tags: ["stats:big3"] }
);

export async function getBig3ProgressData(
  userId: string,
  {
    preset = "month",
  }: {
    preset?: DateRangePreset;
  } = {}
): Promise<{
  success: boolean;
  error?: string;
  data?: Big3ProgressData;
}> {
  try {
    const data = await fetchBig3ProgressCached(userId, preset);

    return {
      success: true,
      data,
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
const fetchExerciseProgressCached = unstable_cache(
  async (userId: string, exerciseId: string, preset: DateRangePreset) => {
    const startDate = getStartDate(preset);

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
          eq(sets.isWarmup, false)
        )
      )
      .groupBy(workoutSessions.date)
      .orderBy(workoutSessions.date);

    return extractMaxWeightUpdates(maxWeightByDate);
  },
  ["stats-exercise"],
  { tags: ["stats:exercise"] }
);

export async function getExerciseProgressData(
  userId: string,
  {
    exerciseId,
    preset = "month",
  }: {
    exerciseId: string;
    preset?: DateRangePreset;
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: ExerciseProgressData[];
}> {
  try {
    const progressData = await fetchExerciseProgressCached(
      userId,
      exerciseId,
      preset
    );

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
