"use server";

import { db } from "../../../db";
import { sets, cardioRecords, exercises, workoutSessions } from "../../../db/schemas/app";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
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

    // セット記録を取得
    const setsData = await db
      .select()
      .from(sets)
      .where(eq(sets.sessionId, sessionId))
      .orderBy(sets.exerciseId, sets.setOrder);

    // 有酸素記録を取得（テーブルが存在しない場合は空配列を返す）
    const cardioData = await handleTableNotExistsError(
      () =>
        db
          .select()
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

    // 日付範囲内のセッションを取得
    const sessions = await db
      .select({
        id: workoutSessions.id,
        date: workoutSessions.date,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.date, startDate),
          lte(workoutSessions.date, endDate)
        )
      );

    if (sessions.length === 0) {
      return {
        success: true,
        data: {},
      };
    }

    const sessionIds = sessions.map((s) => s.id);

    // セッションごとの種目IDを取得（筋トレ種目）
    const workoutExerciseIds = await db
      .selectDistinct({
        sessionId: sets.sessionId,
        exerciseId: sets.exerciseId,
      })
      .from(sets)
      .where(inArray(sets.sessionId, sessionIds));

    // セッションごとの種目IDを取得（有酸素種目）
    // テーブルが存在しない場合は空配列を返す
    const cardioExerciseIds = await handleTableNotExistsError(
      () =>
        db
          .selectDistinct({
            sessionId: cardioRecords.sessionId,
            exerciseId: cardioRecords.exerciseId,
          })
          .from(cardioRecords)
          .where(inArray(cardioRecords.sessionId, sessionIds)),
      [],
      "cardio_records"
    );

    // 全ての種目IDを取得
    const allExerciseIds = [
      ...new Set([
        ...workoutExerciseIds.map((e) => e.exerciseId),
        ...cardioExerciseIds.map((e) => e.exerciseId),
      ]),
    ];

    if (allExerciseIds.length === 0) {
      return {
        success: true,
        data: {},
      };
    }

    // 種目IDから部位を取得
    const exerciseBodyParts = await db
      .select({
        id: exercises.id,
        bodyPart: exercises.bodyPart,
      })
      .from(exercises)
      .where(inArray(exercises.id, allExerciseIds));

    // 種目ID → 部位のマップを作成
    const exerciseIdToBodyPart = new Map<string, BodyPart>();
    exerciseBodyParts.forEach((ex) => {
      exerciseIdToBodyPart.set(ex.id, ex.bodyPart as BodyPart);
    });

    // 日付ごとに部位を集計
    const bodyPartsByDate: Record<string, Set<BodyPart>> = {};

    // セッションID → 日付のマップを作成
    // データベースから取得した日付はyyyy-MM-dd形式の文字列
    const sessionIdToDate = new Map<string, string>();
    sessions.forEach((s) => {
      sessionIdToDate.set(s.id, s.date);
    });

    // 部位を集計する共通関数
    const addBodyPartToDate = (
      sessionId: string,
      exerciseId: string
    ): void => {
      const date = sessionIdToDate.get(sessionId);
      const bodyPart = exerciseIdToBodyPart.get(exerciseId);
      if (date && bodyPart) {
        if (!bodyPartsByDate[date]) {
          bodyPartsByDate[date] = new Set();
        }
        bodyPartsByDate[date].add(bodyPart);
      }
    };

    // 筋トレ種目の部位を集計
    workoutExerciseIds.forEach(({ sessionId, exerciseId }) => {
      addBodyPartToDate(sessionId, exerciseId);
    });

    // 有酸素種目の部位を集計
    cardioExerciseIds.forEach(({ sessionId, exerciseId }) => {
      addBodyPartToDate(sessionId, exerciseId);
    });

    // Setを配列に変換
    const result: Record<string, BodyPart[]> = {};
    Object.keys(bodyPartsByDate).forEach((date) => {
      result[date] = Array.from(bodyPartsByDate[date]);
    });

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
