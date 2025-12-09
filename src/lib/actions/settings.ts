"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../../db";
import { workoutSessions, profileHistory } from "../../../db/schemas/app";
import { users } from "../../../db/schemas/auth";
import { eq } from "drizzle-orm";

/**
 * ユーザーの全トレーニングデータとプロフィール履歴を削除する
 * （アカウント自体は残す）
 */
export async function deleteUserAllData(userId: string) {
  try {
    await db.delete(workoutSessions).where(eq(workoutSessions.userId, userId));
    await db.delete(profileHistory).where(eq(profileHistory.userId, userId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("データ削除エラー:", error);
    return { success: false, error: "データの削除に失敗しました" };
  }
}

/**
 * アカウントを完全に削除する（退会）
 */
export async function deleteUserAccount(userId: string) {
  try {
    // ユーザーを削除
    // 関連データはDBのカスケード設定で消える前提
    await db.delete(users).where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error("アカウント削除エラー:", error);
    return { success: false, error: "アカウントの削除に失敗しました" };
  }
}
