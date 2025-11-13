import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// .env.localファイルを読み込む（存在しない場合は無視される）
config({ path: ".env.local" });

// 環境変数の検証とデバッグ
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  console.error("Please set DATABASE_URL in GitHub Secrets or .env.local file");
  process.exit(1);
}

// デバッグ情報（パスワード部分はマスク）
const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ":****@");
console.log("✅ DATABASE_URL is set:", maskedUrl);

export default defineConfig({
  schema: "./db/schemas/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
