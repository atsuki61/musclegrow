import { z } from "zod";

/**
 * 環境変数の型安全な検証スキーマ
 */
const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET は必須です"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL は必須です"),
  BETTER_AUTH_GOOGLE_CLIENT_ID: z
    .string()
    .min(1, "BETTER_AUTH_GOOGLE_CLIENT_ID は必須です"),
  BETTER_AUTH_GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, "BETTER_AUTH_GOOGLE_CLIENT_SECRET は必須です"),
});

/**
 * 検証済み環境変数（型安全）
 * parse 時に自動的に検証され、エラー時は zod のエラーメッセージが表示される
 */
export const env = envSchema.parse({
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_GOOGLE_CLIENT_ID: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,
  BETTER_AUTH_GOOGLE_CLIENT_SECRET:
    process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
});

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
