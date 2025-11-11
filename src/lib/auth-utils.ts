"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * 現在のユーザーIDを取得する
 * サーバーアクションから使用する共通関数
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
