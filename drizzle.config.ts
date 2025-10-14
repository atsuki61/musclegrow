import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// .env.localファイルを読み込む
config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schemas/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
