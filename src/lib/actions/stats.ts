"use server";

import { db } from "../../../db";
import {
  profileHistory,
  sets,
  workoutSessions,
  exercises,
} from "../../../db/schemas/app";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq, and, gte, sql } from "drizzle-orm";
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

    // TODO: ダミーデータ - 後で削除
    const startDate = getStartDate(preset);
    const dummyData = generateDummyWeightData(userId, startDate);
    return {
      success: true,
      data: dummyData,
    };

    // 実際のデータ取得コード（一時的にコメントアウト）
    /*
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
    */
  } catch (error) {
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
 * ダミー体重データを生成（1〜12月、月3件、60〜80kg）
 * TODO: 後で削除
 */
function generateDummyWeightData(
  userId: string,
  startDate: Date
): ProfileHistoryData[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const data: ProfileHistoryData[] = [];

  // 体重を60〜80kgの間で行ったり来たりさせる
  let weight = 65; // 初期値
  let direction = 1; // 1: 増加, -1: 減少

  for (let month = 1; month <= 12; month++) {
    // 月に3つのデータポイントを作成
    for (let day = 1; day <= 3; day++) {
      const date = new Date(currentYear, month - 1, day * 10); // 10日、20日、30日ごろ

      // 開始日以降のデータのみを含める
      if (date < startDate) {
        continue;
      }

      // 体重を変動させる（±2kg程度）
      const variation = (Math.random() - 0.5) * 4; // -2〜+2kg
      weight += variation * direction;

      // 60〜80kgの範囲に収める
      if (weight > 80) {
        weight = 80;
        direction = -1; // 減少に転換
      } else if (weight < 60) {
        weight = 60;
        direction = 1; // 増加に転換
      }

      // 月の終わりに方向を変えることもある
      if (day === 3 && Math.random() > 0.7) {
        direction *= -1;
      }

      data.push({
        id: `dummy-${month}-${day}`,
        userId,
        height: 170, // 固定値
        weight: Math.round(weight * 10) / 10, // 小数点第1位まで
        bodyFat: null,
        muscleMass: null,
        bmi: null,
        recordedAt: date.toISOString(),
      });
    }
  }

  return data;
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

    // Big3種目のIDを取得
    const big3Exercises = await db
      .select({ id: exercises.id, name: exercises.name })
      .from(exercises)
      .where(eq(exercises.isBig3, true));

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
            gte(workoutSessions.date, format(startDate, "yyyy-MM-dd")),
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
  } catch (error) {
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
  } catch (error) {
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
