"use server";

import { revalidateTag } from "next/cache";
import { db } from "../../../db";
import { workoutSessions, sets, cardioRecords } from "../../../db/schemas/app";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

/**
 * ワークアウトセッションを保存または更新する
 * @param userId ユーザーID
 * @param sessionData セッションデータ
 */
export async function saveWorkoutSession(
  userId: string,
  {
    date,
    note,
    durationMinutes,
  }: {
    date: string; // YYYY-MM-DD形式
    note?: string | null;
    durationMinutes?: number | null;
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string; date: string };
}> {
  try {
    // 既存のセッションを確認
    const [existingSession] = await db
      .select()
      .from(workoutSessions)
      .where(
        and(eq(workoutSessions.userId, userId), eq(workoutSessions.date, date))
      )
      .limit(1);

    let sessionId: string;

    if (existingSession) {
      // 更新
      await db
        .update(workoutSessions)
        .set({
          note: note ?? existingSession.note,
          durationMinutes: durationMinutes ?? existingSession.durationMinutes,
          updatedAt: new Date(),
        })
        .where(eq(workoutSessions.id, existingSession.id));
      sessionId = existingSession.id;
    } else {
      // 新規作成
      const [newSession] = await db
        .insert(workoutSessions)
        .values({
          userId,
          date,
          note: note ?? null,
          durationMinutes: durationMinutes ?? null,
        })
        .returning({ id: workoutSessions.id });
      sessionId = newSession.id;

      // 新規作成時のみ、合計日数のキャッシュを更新する
      revalidateTag(`stats:total-days:${userId}`);
    }

    revalidateTag(`workout-session:${userId}:${date}`);

    return {
      success: true,
      data: { id: sessionId, date },
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    console.error("セッション保存エラー:", errorMessage);
    return {
      success: false,
      error: "セッションの保存に失敗しました",
    };
  }
}

/**
 * 指定日付のワークアウトセッションを取得する
 * @param userId ユーザーID
 * @param date 日付 (YYYY-MM-DD)
 */
export async function getWorkoutSession(
  userId: string,
  date: string
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    id: string;
    date: string;
    note?: string | null;
    durationMinutes?: number | null;
  };
}> {
  try {
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(
        and(eq(workoutSessions.userId, userId), eq(workoutSessions.date, date))
      )
      .limit(1);

    if (!session) {
      // セッションが存在しない場合はnullを返す（エラーではない）
      return { success: true, data: undefined };
    }

    return {
      success: true,
      data: {
        id: session.id,
        date: session.date,
        note: session.note,
        durationMinutes: session.durationMinutes,
      },
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    console.error("セッション取得エラー:", errorMessage);
    return {
      success: false,
      error: "セッションの取得に失敗しました",
    };
  }
}

/**
 * 日付範囲でワークアウトセッション一覧を取得する
 * @param userId ユーザーID
 * @param range 日付範囲
 */
export async function getWorkoutSessionsByDateRange(
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
  data?: Array<{
    id: string;
    date: string;
    note?: string | null;
    durationMinutes?: number | null;
  }>;
}> {
  try {
    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.date, startDate),
          lte(workoutSessions.date, endDate)
        )
      )
      .orderBy(desc(workoutSessions.date));

    return {
      success: true,
      data: sessions.map((s) => ({
        id: s.id,
        date: s.date,
        note: s.note,
        durationMinutes: s.durationMinutes,
      })),
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    console.error("セッション一覧取得エラー:", errorMessage);
    return {
      success: false,
      error: "セッション一覧の取得に失敗しました",
    };
  }
}

// データベースクエリ結果の型定義
interface SqlResult {
  rows: Record<string, unknown>[];
}

/**
 * ユーザーの全期間の種目別最終トレーニング日を取得する
 * @param userId ユーザーID
 * @returns Record<exerciseId, dateString(YYYY-MM-DD)>
 */
export async function getLastTrainedDatesFromDB(userId: string): Promise<{
  success: boolean;
  data?: Record<string, string>;
  error?: string;
}> {
  try {
    // セット記録がある種目の最終日
    const setsResult = (await db.execute(sql`
      SELECT 
        ${sets.exerciseId} as exercise_id,
        MAX(${workoutSessions.date}) as last_date
      FROM ${workoutSessions}
      JOIN ${sets} ON ${sets.sessionId} = ${workoutSessions.id}
      WHERE ${workoutSessions.userId} = ${userId}
      GROUP BY ${sets.exerciseId}
    `)) as unknown as SqlResult;

    // 有酸素記録がある種目の最終日
    const cardioResult = (await db.execute(sql`
      SELECT 
        ${cardioRecords.exerciseId} as exercise_id,
        MAX(${workoutSessions.date}) as last_date
      FROM ${workoutSessions}
      JOIN ${cardioRecords} ON ${cardioRecords.sessionId} = ${workoutSessions.id}
      WHERE ${workoutSessions.userId} = ${userId}
      GROUP BY ${cardioRecords.exerciseId}
    `)) as unknown as SqlResult;

    const map: Record<string, string> = {};

    // マージ処理
    const processRow = (row: Record<string, unknown>) => {
      if (
        typeof row.exercise_id === "string" &&
        typeof row.last_date === "string"
      ) {
        const exerciseId = row.exercise_id;
        const lastDate = row.last_date;

        if (!map[exerciseId] || lastDate > map[exerciseId]) {
          map[exerciseId] = lastDate;
        }
      }
    };

    if (Array.isArray(setsResult.rows)) {
      setsResult.rows.forEach(processRow);
    }

    if (Array.isArray(cardioResult.rows)) {
      cardioResult.rows.forEach(processRow);
    }

    return { success: true, data: map };
  } catch (error) {
    console.error("最終トレーニング日取得エラー:", error);
    return { success: false, error: "データの取得に失敗しました" };
  }
}
