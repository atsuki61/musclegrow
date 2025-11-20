"use server";

import { db } from "../../../db";
import { sets, exercises, workoutSessions } from "../../../db/schemas/app";
import { eq, and, sql, isNull, or, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";

type Big3MaxWeightsResult = {
  success: boolean;
  error?: string;
  data?: {
    benchPress: { exerciseId: string; maxWeight: number };
    squat: { exerciseId: string; maxWeight: number };
    deadlift: { exerciseId: string; maxWeight: number };
  };
};

/**
 * 空のBig3データを返すヘルパー関数
 */
function createEmptyBig3Data(
  benchPressId: string = "",
  squatId: string = "",
  deadliftId: string = ""
): Big3MaxWeightsResult {
  return {
    success: true,
    data: {
      benchPress: { exerciseId: benchPressId, maxWeight: 0 },
      squat: { exerciseId: squatId, maxWeight: 0 },
      deadlift: { exerciseId: deadliftId, maxWeight: 0 },
    },
  };
}

/**
 * Big3種目の最大重量を取得する
 * @param userId ユーザーID
 * @returns Big3種目（ベンチプレス、スクワット、デッドリフト）の最大重量
 */
async function getBig3MaxWeightsInternal(
  userId: string | null
): Promise<Big3MaxWeightsResult> {
  try {

    // Big3種目を取得（名前で検索）
    // 認証されていない場合は共通マスタ（userIdがnull）のみを取得
    let big3Exercises;
    try {
      big3Exercises = await db
        .select()
        .from(exercises)
        .where(
          userId
            ? and(
                or(isNull(exercises.userId), eq(exercises.userId, userId)),
                eq(exercises.isBig3, true)
              )
            : and(isNull(exercises.userId), eq(exercises.isBig3, true))
        );
    } catch (dbError) {
      // エラーメッセージを取得（ネストされたエラーオブジェクトにも対応）
      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);
      const causeMessage =
        dbError instanceof Error &&
        "cause" in dbError &&
        dbError.cause instanceof Error
          ? dbError.cause.message
          : "";

      // データベース接続エラーまたはスキーマエラーの場合は、空のデータを返してローカルストレージから取得させる
      if (
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("connect") ||
        errorMessage.includes("does not exist") ||
        causeMessage.includes("ECONNREFUSED") ||
        causeMessage.includes("connect") ||
        causeMessage.includes("does not exist")
      ) {
        return createEmptyBig3Data();
      }
      // その他のエラーは再スロー
      throw dbError;
    }

    // 種目名でマッピング
    const benchPressExercise = big3Exercises.find(
      (ex) => ex.name === "ベンチプレス"
    );
    const squatExercise = big3Exercises.find((ex) => ex.name === "スクワット");
    const deadliftExercise = big3Exercises.find(
      (ex) => ex.name === "デッドリフト"
    );

    // 種目が見つからない場合は、種目IDのみを返す（ローカルストレージから取得するため）
    if (!benchPressExercise || !squatExercise || !deadliftExercise) {
      return createEmptyBig3Data(
        benchPressExercise?.id ?? "",
        squatExercise?.id ?? "",
        deadliftExercise?.id ?? ""
      );
    }

    // 認証されていない場合は、種目IDのみを返す（ローカルストレージから取得するため）
    if (!userId) {
      return createEmptyBig3Data(
        benchPressExercise.id,
        squatExercise.id,
        deadliftExercise.id
      );
    }

    // ユーザーのセッションIDを取得
    const userSessions = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId));

    const sessionIds = userSessions.map((s) => s.id);

    if (sessionIds.length === 0) {
      return createEmptyBig3Data(
        benchPressExercise.id,
        squatExercise.id,
        deadliftExercise.id
      );
    }

    // 各種目の最大重量を取得（ウォームアップセットは除外）
    const getMaxWeight = async (exerciseId: string): Promise<number> => {
      const result = await db
        .select({
          maxWeight: sql<number>`MAX(CAST(${sets.weight} AS FLOAT))`,
        })
        .from(sets)
        .where(
          and(
            eq(sets.exerciseId, exerciseId),
            eq(sets.isWarmup, false),
            inArray(sets.sessionId, sessionIds)
          )
        );

      const maxWeightValue = result[0]?.maxWeight ?? 0;
      return typeof maxWeightValue === "number"
        ? maxWeightValue
        : parseFloat(String(maxWeightValue)) || 0;
    };

    const [benchPressMax, squatMax, deadliftMax] = await Promise.all([
      getMaxWeight(benchPressExercise.id),
      getMaxWeight(squatExercise.id),
      getMaxWeight(deadliftExercise.id),
    ]);

    return {
      success: true,
      data: {
        benchPress: {
          exerciseId: benchPressExercise.id,
          maxWeight: benchPressMax,
        },
        squat: {
          exerciseId: squatExercise.id,
          maxWeight: squatMax,
        },
        deadlift: {
          exerciseId: deadliftExercise.id,
          maxWeight: deadliftMax,
        },
      },
    };
  } catch (error: unknown) {
    // 開発環境でのみエラーをログに出力
    if (process.env.NODE_ENV === "development") {
      console.error("Big3最大重量取得エラー:", error);
    }

    // エラー時は、空の種目IDを返してローカルストレージから取得させる
    // これにより、データベース接続エラー時でもモックデータを使用できる
    return createEmptyBig3Data();
  }
}

export const getBig3MaxWeights = unstable_cache(
  async (userId: string | null) => {
    return await getBig3MaxWeightsInternal(userId);
  },
  ["big3-max-weights"],
  {
    tags: ["big3-max-weights"],
    revalidate: 3600,
  }
);
