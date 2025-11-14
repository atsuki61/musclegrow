/**
 * 環境変数の検証
 * アプリケーション起動時に必要な環境変数がすべて設定されているかチェック
 */

const requiredEnvVars = {
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_GOOGLE_CLIENT_ID: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,
  BETTER_AUTH_GOOGLE_CLIENT_SECRET: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
} as const;

/**
 * 必須の環境変数がすべて設定されているか検証
 * @throws {Error} 必須の環境変数が未設定の場合
 */
export function validateRequiredEnvVars(): void {
  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `必須の環境変数が設定されていません: ${missing.join(", ")}\n` +
      `.env.local ファイルを確認してください。`
    );
  }
}

/**
 * 環境変数の存在確認（boolean）
 */
export function checkEnvVars() {
  return {
    betterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
    databaseUrl: !!process.env.DATABASE_URL,
    googleClientId: !!process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,
    googleClientSecret: !!process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
  };
}

