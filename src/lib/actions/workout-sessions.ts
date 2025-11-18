"use server";

import { db } from "../../../db";
import { workoutSessions } from "../../../db/schemas/app";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * ワークアウトセッションを保存または更新する
 * @param userId ユーザーID
 * @param date トレーニング日（YYYY-MM-DD形式の文字列）
 * @param note メモ（オプション）
 * @param durationMinutes トレーニング時間（分、オプション）
 * @returns 保存結果
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
    const existingSession = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.date, date)
        )
      )
      .limit(1);

    if (existingSession.length > 0) {
      // 既存セッションを更新
      const [updated] = await db
        .update(workoutSessions)
        .set({
          note: note ?? null,
          durationMinutes: durationMinutes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(workoutSessions.id, existingSession[0].id))
        .returning();

      return {
        success: true,
        data: {
          id: updated.id,
          date: updated.date,
        },
      };
    } else {
      // 新規セッションを作成
      const [created] = await db
        .insert(workoutSessions)
        .values({
          userId,
          date,
          note: note ?? null,
          durationMinutes: durationMinutes ?? null,
        })
        .returning();

      return {
        success: true,
        data: {
          id: created.id,
          date: created.date,
        },
      };
    }
  } catch (error: unknown) {
    console.error("ワークアウトセッション保存エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ワークアウトセッションの保存に失敗しました",
    };
  }
}

/**
 * 指定日付のワークアウトセッションを取得する
 * @param userId ユーザーID
 * @param date トレーニング日（YYYY-MM-DD形式の文字列）
 * @returns セッション情報
 */
export async function getWorkoutSession(
  userId: string,
  date: string
): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string; date: string; note?: string | null; durationMinutes?: number | null };
}> {
  try {

    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.date, date)
        )
      )
      .limit(1);

    if (!session) {
      return {
        success: true,
        data: undefined,
      };
    }

    return {
      success: true,
      data: {
        id: session.id,
        date: session.date,
        note: session.note ?? undefined,
        durationMinutes: session.durationMinutes ?? undefined,
      },
    };
  } catch (error: unknown) {
    console.error("ワークアウトセッション取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ワークアウトセッションの取得に失敗しました",
    };
  }
}

/**
 * 日付範囲でワークアウトセッション一覧を取得する
 * @param userId ユーザーID
 * @param startDate 開始日（YYYY-MM-DD形式の文字列）
 * @param endDate 終了日（YYYY-MM-DD形式の文字列）
 * @returns セッション一覧
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
      .select({
        id: workoutSessions.id,
        date: workoutSessions.date,
        note: workoutSessions.note,
        durationMinutes: workoutSessions.durationMinutes,
      })
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
      data: sessions.map((session) => ({
        id: session.id,
        date: session.date,
        note: session.note ?? undefined,
        durationMinutes: session.durationMinutes ?? undefined,
      })),
    };
  } catch (error: unknown) {
    console.error("ワークアウトセッション一覧取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ワークアウトセッション一覧の取得に失敗しました",
    };
  }
}

