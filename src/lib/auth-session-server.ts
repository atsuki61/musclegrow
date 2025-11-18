import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Server Component用: 認証セッションを取得する関数
 * cache()を使用して、同一リクエスト内で複数回呼ばれても1回だけ実行される
 */
export const getAuthSession = cache(async () => {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: h,
  });
  return session;
});

/**
 * Server Component用: ユーザーIDを取得する関数
 * getAuthSession()の結果をキャッシュして再利用
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getAuthSession();
  return session?.user?.id ?? null;
}

