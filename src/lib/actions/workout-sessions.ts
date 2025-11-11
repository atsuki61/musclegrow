"use server";

import { db } from "../../../db";
import { workoutSessions } from "../../../db/schemas/app";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";

/**
 * ワークアウトセッションを保存または更新する
 * @param date トレーニング日（YYYY-MM-DD形式の文字列）
 * @param note メモ（オプション）
 * @param durationMinutes トレーニング時間（分、オプション）
 * @returns 保存結果
 */
export async function saveWorkoutSession({
  date,
  note,
  durationMinutes,
}: {
  date: string; // YYYY-MM-DD形式
  note?: string | null;
  durationMinutes?: number | null;
}): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string; date: string };
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

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
  } catch (error) {
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
 * @param date トレーニング日（YYYY-MM-DD形式の文字列）
 * @returns セッション情報
 */
export async function getWorkoutSession(
  date: string
): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string; date: string; note?: string | null; durationMinutes?: number | null };
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

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
  } catch (error) {
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

