"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "../../../db";
import { workoutSessions, profileHistory } from "../../../db/schemas/app";
import { users, accounts } from "../../../db/schemas/auth";
import { eq, and, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// BetterAuthのAPI型定義を補完
interface AuthApiWithSetPassword {
  setPassword: (params: {
    body: { newPassword: string };
    headers: Headers;
  }) => Promise<void>;
}

/**
 * ユーザーの全トレーニングデータとプロフィール履歴を削除する
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
    await db.delete(users).where(eq(users.id, userId));
    return { success: true };
  } catch (error) {
    console.error("アカウント削除エラー:", error);
    return { success: false, error: "アカウントの削除に失敗しました" };
  }
}

/**
 * ユーザーがパスワードを設定済みか確認する
 */
export async function checkUserHasPassword(userId: string): Promise<boolean> {
  try {
    const account = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), isNotNull(accounts.password)))
      .limit(1);

    return account.length > 0;
  } catch (error) {
    console.error("パスワード確認エラー:", error);
    return false;
  }
}

//パスワードを新規設定する（未設定ユーザー用）
export async function setUserPassword(password: string) {
  try {
    // サーバー側のAPIを使用してパスワードを設定
    await (auth.api as unknown as AuthApiWithSetPassword).setPassword({
      body: {
        newPassword: password,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error: unknown) {
    // any を使わず unknown として扱い、型ガードでプロパティにアクセスする
    let message = "パスワードの設定に失敗しました";

    if (error instanceof Error) {
      message = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "body" in error &&
      typeof (error as { body: { message?: string } }).body?.message ===
        "string"
    ) {
      // BetterAuthのエラーオブジェクト構造への対応
      message = (error as { body: { message: string } }).body.message;
    }

    console.error("パスワード設定エラー:", error);
    return { success: false, error: message };
  }
}

//Google連携の状態を確認する
export async function checkGoogleConnection(userId: string): Promise<boolean> {
  try {
    const account = await db
      .select()
      .from(accounts)
      .where(
        and(eq(accounts.userId, userId), eq(accounts.providerId, "google"))
      )
      .limit(1);

    return account.length > 0;
  } catch (error) {
    console.error("Google連携確認エラー:", error);
    return false;
  }
}

//Google連携を解除する
export async function unlinkGoogleAccount(userId: string) {
  try {
    // 1. パスワード設定済みか確認（安全策）
    const hasPassword = await checkUserHasPassword(userId);
    if (!hasPassword) {
      return {
        success: false,
        error:
          "パスワードが設定されていないため、連携を解除できません。先にパスワードを設定してください。",
      };
    }

    // 2. Googleの連携情報を削除
    await db
      .delete(accounts)
      .where(
        and(eq(accounts.userId, userId), eq(accounts.providerId, "google"))
      );

    return { success: true };
  } catch (error) {
    console.error("Google連携解除エラー:", error);
    return { success: false, error: "連携の解除に失敗しました" };
  }
}
