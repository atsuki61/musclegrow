"use server";

import { getAuthUserId } from "@/lib/auth-session-server";

/**
 * 開発環境の環境変数設定状況を確認する
 * ※ セキュリティのため、管理者権限（あるいは開発モード）でのみ実行可能とする制限を推奨
 */
export async function checkEnvironmentVariables(): Promise<{
  success: boolean;
  data?: {
    environment: string;
    checks: {
      betterAuthSecret: boolean;
      googleClientId: boolean;
      googleClientSecret: boolean;
    };
    previews: {
      clientIdPreview: string;
      secretPreview: string;
    };
  };
  error?: string;
}> {
  // 開発環境でのみ動作するようにする
  if (process.env.NODE_ENV !== "development") {
    return {
      success: false,
      error: "Not available in production",
    };
  }

  // 認証チェック（オプション：開発ツールなので誰でも見れるとまずい場合は追加）
  // const userId = await getAuthUserId();
  // if (!userId) { ... }

  return {
    success: true,
    data: {
      environment: process.env.NODE_ENV,
      checks: {
        betterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
        googleClientId: !!process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,
        googleClientSecret: !!process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
      },
      // 最初の数文字だけ表示（セキュリティ考慮）
      previews: {
        clientIdPreview: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID
          ? process.env.BETTER_AUTH_GOOGLE_CLIENT_ID.substring(0, 15) + "..."
          : "未設定",
        secretPreview: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET
          ? process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET.substring(0, 10) +
            "..."
          : "未設定",
      },
    },
  };
}
