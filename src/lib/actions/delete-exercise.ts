"use server";

import { revalidateTag } from "next/cache";
import { db } from "../../../db";
import { sets, cardioRecords, workoutSessions } from "../../../db/schemas/app";
import { eq, and, sql } from "drizzle-orm";

/**
 * セッションが空になったか確認し、空なら削除する内部関数
 */
async function deleteSessionIfEmpty(userId: string, sessionId: string) {
  // 残りのセット数をカウント
  const [setsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sets)
    .where(eq(sets.sessionId, sessionId));

  // 残りの有酸素記録数をカウント
  const [cardioCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(cardioRecords)
    .where(eq(cardioRecords.sessionId, sessionId));

  const totalRemaining =
    Number(setsCount?.count ?? 0) + Number(cardioCount?.count ?? 0);

  // 記録が1つも残っていなければ、セッション（箱）自体を削除
  if (totalRemaining === 0) {
    await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));

    // 合計日数が減るのでキャッシュを更新
    revalidateTag(`stats:total-days:${userId}`);
  }

  // カレンダーの色分けやセッション詳細のキャッシュも更新
  revalidateTag("history-bodyparts");
  revalidateTag(`history-session`);
}

/**
 * 指定セッション・種目のセット記録を削除する
 */
export async function deleteExerciseSets(
  userId: string,
  {
    sessionId,
    exerciseId,
  }: {
    sessionId: string;
    exerciseId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(sets)
      .where(
        and(eq(sets.sessionId, sessionId), eq(sets.exerciseId, exerciseId))
      );

    // セッションが空になったかチェックして削除
    await deleteSessionIfEmpty(userId, sessionId);

    return { success: true };
  } catch (error: unknown) {
    console.error("セット記録削除エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "セット記録の削除に失敗しました",
    };
  }
}

/**
 * 指定セッション・種目の有酸素記録を削除する
 */
export async function deleteCardioRecords(
  userId: string,
  {
    sessionId,
    exerciseId,
  }: {
    sessionId: string;
    exerciseId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(cardioRecords)
      .where(
        and(
          eq(cardioRecords.sessionId, sessionId),
          eq(cardioRecords.exerciseId, exerciseId)
        )
      );

    // セッションが空になったかチェックして削除
    await deleteSessionIfEmpty(userId, sessionId);

    return { success: true };
  } catch (error: unknown) {
    console.error("有酸素記録削除エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "有酸素記録の削除に失敗しました",
    };
  }
}
