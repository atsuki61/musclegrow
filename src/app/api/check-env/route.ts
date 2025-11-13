import { NextResponse } from "next/server";

/**
 * 環境変数チェック用APIエンドポイント
 * 開発環境でのみ利用可能
 * 
 * アクセス: http://localhost:3001/api/check-env
 */
export async function GET() {
  // 開発環境でのみ動作するようにする
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    status: "ok",
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
        ? process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET.substring(0, 10) + "..."
        : "未設定",
    },
  });
}

