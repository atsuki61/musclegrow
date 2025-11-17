"use server";

import { db } from "../../../db";
import { sets, cardioRecords, exercises, workoutSessions } from "../../../db/schemas/app";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq, and, gte, lte } from "drizzle-orm";
import type { SetRecord, CardioRecord } from "@/types/workout";
import type { BodyPart } from "@/types/workout";

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
    if (
      error instanceof Error &&
      error.message.includes("does not exist")
    ) {
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

    // セッションがそのユーザーのものか確認
    const [session] = await db
      .select({ userId: workoutSessions.userId })
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return {
        success: false,
        error: "セッションが見つかりません",
      };
    }

    if (session.userId !== userId) {
      return {
        success: false,
        error: "このセッションにアクセスする権限がありません",
      };
    }

    // セット記録を取得
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

    // 有酸素記録を取得（テーブルが存在しない場合は空配列を返す）
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
          })
          .from(cardioRecords)
          .where(eq(cardioRecords.sessionId, sessionId))
          .orderBy(cardioRecords.exerciseId, cardioRecords.createdAt),
      [],
      "cardio_records"
    );

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
  } catch (error: unknown) {
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

/**
 * 日付範囲で日付ごとの部位一覧を取得する（カレンダー色付け用）
 * @param startDate 開始日（YYYY-MM-DD形式の文字列）
 * @param endDate 終了日（YYYY-MM-DD形式の文字列）
 * @returns 日付文字列をキー、部位配列を値とするオブジェクト
 */
export async function getBodyPartsByDateRange({
  startDate,
  endDate,
}: {
  startDate: string; // YYYY-MM-DD形式
  endDate: string; // YYYY-MM-DD形式
}): Promise<{
  success: boolean;
  error?: string;
  data?: Record<string, BodyPart[]>; // 日付文字列をキー、部位配列を値
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

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
          .innerJoin(cardioRecords, eq(cardioRecords.sessionId, workoutSessions.id))
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
