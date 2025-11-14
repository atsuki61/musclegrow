"use server";

import { db } from "../../../db";
import { sets, cardioRecords } from "../../../db/schemas/app";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";

/**
 * 認証チェックの共通処理
 * @returns 認証済みユーザーID、またはnull
 */
async function checkAuth(): Promise<string | null> {
  return await getCurrentUserId();
}

/**
 * 指定セッション・種目のセット記録を削除する
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @returns 削除結果
 */
export async function deleteExerciseSets({
  sessionId,
  exerciseId,
}: {
  sessionId: string;
  exerciseId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await checkAuth();
    if (!userId) {
      return { success: false, error: "認証が必要です" };
    }

    await db.delete(sets).where(
      and(eq(sets.sessionId, sessionId), eq(sets.exerciseId, exerciseId))
    );

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
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @returns 削除結果
 */
export async function deleteCardioRecords({
  sessionId,
  exerciseId,
}: {
  sessionId: string;
  exerciseId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await checkAuth();
    if (!userId) {
      return { success: false, error: "認証が必要です" };
    }

    await db.delete(cardioRecords).where(
      and(
        eq(cardioRecords.sessionId, sessionId),
        eq(cardioRecords.exerciseId, exerciseId)
      )
    );

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
