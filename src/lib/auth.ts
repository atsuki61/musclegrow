import { betterAuth } from "better-auth";
import { nanoid } from "nanoid";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../../db";
import { getBaseURL } from "./get-base-url";
import * as schema from "../../db/schemas/auth";
import { env } from "./env-validation";

// env の parse が実行されることで自動的に検証される
// エラー時は zod のエラーメッセージが表示される

/**
 * Better Auth設定
 * メール/パスワード認証とGoogle OAuth認証を有効化
 */
export const auth = betterAuth({
  baseURL: getBaseURL(),
  //データベース接続
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
  }),
  // セッション暗号化用のシークレットキー
  secret: env.BETTER_AUTH_SECRET,
  // メール/パスワード認証を有効化
  emailAndPassword: {
    enabled: true,
  },
  // Google OAuth認証を有効化
  socialProviders: {
    google: {
      clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
    },
  },
  // ID生成方法のカスタマイズ（nanoid(10)）
  advanced: {
    database: {
      generateId: () => nanoid(10),
    },
  },
  //Next.js Cookiesプラグイン
  plugins: [nextCookies()],
});
