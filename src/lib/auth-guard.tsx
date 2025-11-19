// src/lib/auth-guard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/auth-session-context";

/**
 * AuthGuard
 * - AuthSessionProvider から userId を取得して認証チェック
 * - BetterAuth の useSession() は使用しない
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userId } = useAuthSession(); // userId のみ取得（session ではない）

  useEffect(() => {
    // userId がない = 未ログイン → /login へ
    if (!userId) {
      router.push("/login");
    }
  }, [userId, router]);

  // 未ログイン中は何も表示しない（リダイレクト中）
  if (!userId) {
    return null;
  }

  return <>{children}</>;
}
