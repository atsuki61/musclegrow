import { betterAuth } from "better-auth";
import { nanoid } from "nanoid";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../../db";
import { getBaseURL } from "./get-base-url";
import * as schema from "../../db/schemas/auth";

// 環境変数の検証
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required");
}
if (!process.env.BETTER_AUTH_GOOGLE_CLIENT_ID) {
  throw new Error("BETTER_AUTH_GOOGLE_CLIENT_ID environment variable is required");
}
if (!process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET) {
  throw new Error("BETTER_AUTH_GOOGLE_CLIENT_SECRET environment variable is required");
}

export const auth = betterAuth({
  baseURL: getBaseURL(),
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  // Google OAuth プロバイダーを追加
  socialProviders: {
    google: {
      clientId: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    database: {
      generateId: () => nanoid(10),
    },
  },
  plugins: [nextCookies()],
});
