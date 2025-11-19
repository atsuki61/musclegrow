"use server";

import { db } from "../../../db";
import {
  sets,
  cardioRecords,
  exercises,
  workoutSessions,
} from "../../../db/schemas/app";
import { eq, and, gte, lte } from "drizzle-orm";
import type { SetRecord, CardioRecord } from "@/types/workout";
import type { BodyPart } from "@/types/workout";
import { unstable_cache } from "next/cache";

// 月ごとの部位一覧（ユーザー別キャッシュ）
export const cachedGetBodyPartsByDateRange = unstable_cache(
  async (userId: string, range: { startDate: string; endDate: string }) => {
    return await getBodyPartsByDateRange(userId, range);
  },
  // cacheKey（ユーザー別に分ける必要がある）
  ["history-bodyparts"],
  {
    tags: ["history-bodyparts"], // ← 関数は使えない。固定配列のみ
  }
);

// セッション詳細（ユーザー別キャッシュ）
export const cachedGetSessionDetails = unstable_cache(
  async (userId: string, sessionId: string) => {
    return await getSessionDetails(userId, sessionId);
  },
  ["history-session"],
  {
    tags: ["history-session"], // ← 関数 NG。固定配列のみ
  }
);
/**
 * テーブルが存在しない場合のエラーハンドリングを行う共通関数
 * @param queryFn 実行するクエリ関数
 * @param defaultValue エラー時のデフォルト値
 * @param tableName テーブル名（ログ用）
 * @returns クエリ結果またはデフォルト値
 */
async function handleTableNotExistsError<T>(
  queryFn: () => Promise<T>,
  defaultValue: T,
  tableName: string
): Promise<T> {
  try {
    return await queryFn();
  } catch (error: unknown) {
    // テーブルが存在しない場合はデフォルト値を返す
    if (error instanceof Error && error.message.includes("does not exist")) {
      // 開発環境でのみログに出力
      if (process.env.NODE_ENV === "development") {
        console.warn(`${tableName}テーブルが存在しません`);
      }
      return defaultValue;
    }
    // その他のエラーは再スロー
    throw error;
  }
}

/**
 * セッションIDでそのセッションの全種目とセット記録を取得する
 * @param userId ユーザーID
 * @param sessionId ワークアウトセッションID
 * @returns 種目ごとのセット記録と有酸素記録
 */

export async function getSessionDetails(
  userId: string,
  sessionId: string
): Promise<{
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
    // セッション所有者確認
    const [session] = await db
      .select({ userId: workoutSessions.userId })
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return { success: false, error: "セッションが見つかりません" };
    }
    if (session.userId !== userId) {
      return { success: false, error: "アクセス権限がありません" };
    }

    // ================================
    // ① セット記録（無酸素）
    // ================================
    const setsData = await db
      .select({
        id: sets.id,
        exerciseId: sets.exerciseId,
        setOrder: sets.setOrder,
        weight: sets.weight,
        reps: sets.reps,
        rpe: sets.rpe,
        isWarmup: sets.isWarmup,
        restSeconds: sets.restSeconds,
        notes: sets.notes,
        failure: sets.failure,
      })
      .from(sets)
      .where(eq(sets.sessionId, sessionId))
      .orderBy(sets.exerciseId, sets.setOrder);

    const workoutExercisesMap = new Map<string, SetRecord[]>();

    setsData.forEach((row) => {
      const list = workoutExercisesMap.get(row.exerciseId) || [];

      list.push({
        id: row.id,
        setOrder: row.setOrder,
        weight: row.weight ? Number(row.weight) : undefined,
        reps: row.reps,
        rpe: row.rpe ? Number(row.rpe) : null,
        isWarmup: row.isWarmup ?? false,
        restSeconds: row.restSeconds ?? null,
        notes: row.notes ?? null,
        failure: row.failure ?? false,
        duration: null, // ← DBに存在しないので常にnull
      });

      workoutExercisesMap.set(row.exerciseId, list);
    });

    // ================================
    // ② 有酸素記録（cardio）
    // ================================
    const cardioData = await handleTableNotExistsError(
      () =>
        db
          .select({
            id: cardioRecords.id,
            exerciseId: cardioRecords.exerciseId,
            duration: cardioRecords.duration,
            distance: cardioRecords.distance,
            speed: cardioRecords.speed,
            calories: cardioRecords.calories,
            heartRate: cardioRecords.heartRate,
            incline: cardioRecords.incline,
            notes: cardioRecords.notes,
            createdAt: cardioRecords.createdAt,
          })
          .from(cardioRecords)
          .where(eq(cardioRecords.sessionId, sessionId)),
      [],
      "cardio_records"
    );

    const cardioExercisesMap = new Map<string, CardioRecord[]>();

    cardioData.forEach((row) => {
      const list = cardioExercisesMap.get(row.exerciseId) || [];

      list.push({
        id: row.id,
        duration: Number(row.duration),
        distance: row.distance ? Number(row.distance) : null,
        speed: row.speed ? Number(row.speed) : null,
        calories: row.calories ?? null,
        heartRate: row.heartRate ?? null,
        incline: row.incline ? Number(row.incline) : null,
        notes: row.notes ?? null,
        date: new Date(row.createdAt),
      });

      cardioExercisesMap.set(row.exerciseId, list);
    });

    return {
      success: true,
      data: {
        workoutExercises: Array.from(workoutExercisesMap.entries()).map(
          ([exerciseId, sets]) => ({ exerciseId, sets })
        ),
        cardioExercises: Array.from(cardioExercisesMap.entries()).map(
          ([exerciseId, records]) => ({ exerciseId, records })
        ),
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "セッション詳細の取得に失敗しました";

    console.error("セッション取得エラー:", message);
    return { success: false, error: message };
  }
}

/**
 * 日付範囲で日付ごとの部位一覧を取得する（カレンダー色付け用）
 * @param userId ユーザーID
 * @param startDate 開始日（YYYY-MM-DD形式の文字列）
 * @param endDate 終了日（YYYY-MM-DD形式の文字列）
 * @returns 日付文字列をキー、部位配列を値とするオブジェクト
 */
export async function getBodyPartsByDateRange(
  userId: string,
  {
    startDate,
    endDate,
  }: {
    startDate: string; // YYYY-MM-DD形式
    endDate: string; // YYYY-MM-DD形式
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: Record<string, BodyPart[]>; // 日付文字列をキー、部位配列を値
}> {
  try {
    const strengthRows = await db
      .select({
        date: workoutSessions.date,
        bodyPart: exercises.bodyPart,
      })
      .from(workoutSessions)
      .innerJoin(sets, eq(sets.sessionId, workoutSessions.id))
      .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.date, startDate),
          lte(workoutSessions.date, endDate)
        )
      )
      .groupBy(workoutSessions.date, exercises.bodyPart);

    const cardioRows = await handleTableNotExistsError(
      () =>
        db
          .select({
            date: workoutSessions.date,
            bodyPart: exercises.bodyPart,
          })
          .from(workoutSessions)
          .innerJoin(
            cardioRecords,
            eq(cardioRecords.sessionId, workoutSessions.id)
          )
          .innerJoin(exercises, eq(cardioRecords.exerciseId, exercises.id))
          .where(
            and(
              eq(workoutSessions.userId, userId),
              gte(workoutSessions.date, startDate),
              lte(workoutSessions.date, endDate)
            )
          )
          .groupBy(workoutSessions.date, exercises.bodyPart),
      [],
      "cardio_records"
    );

    const bodyPartsByDate: Record<string, Set<BodyPart>> = {};

    const appendRow = (row: { date: string; bodyPart: string | null }) => {
      if (!row.bodyPart) return;
      if (!bodyPartsByDate[row.date]) {
        bodyPartsByDate[row.date] = new Set();
      }
      bodyPartsByDate[row.date].add(row.bodyPart as BodyPart);
    };

    strengthRows.forEach(appendRow);
    cardioRows.forEach(appendRow);

    const result: Record<string, BodyPart[]> = {};
    Object.keys(bodyPartsByDate).forEach((date) => {
      result[date] = Array.from(bodyPartsByDate[date]);
    });

    // TODO: history:month-YYYY-MM といったタグで revalidateTag を行い、更新時のみ再取得する。
    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    console.error("部位一覧取得エラー:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "部位一覧の取得に失敗しました";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
