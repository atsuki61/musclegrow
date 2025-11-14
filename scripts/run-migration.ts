/**
 * マイグレーション実行スクリプト
 * 使用方法: pnpm tsx scripts/run-migration.ts
 */

import { config } from "dotenv";
import { db } from "../db";
import { sql } from "drizzle-orm";

// .env.localファイルを読み込む
config({ path: ".env.local" });

async function runMigration() {
  try {
    console.log("マイグレーションを開始します...");

    // profile_historyテーブルの作成
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "profile_history" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "height" numeric(5, 2),
        "weight" numeric(5, 2),
        "body_fat" numeric(4, 1),
        "muscle_mass" numeric(5, 2),
        "bmi" numeric(4, 1),
        "recorded_at" timestamp DEFAULT now() NOT NULL
      )
    `);
    console.log("✓ profile_historyテーブルを作成しました");

    // 外部キー制約の追加（既に存在する場合はスキップ）
    try {
      await db.execute(sql`
        ALTER TABLE "profile_history" 
        ADD CONSTRAINT "profile_history_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") 
        REFERENCES "public"."users"("id") 
        ON DELETE cascade 
        ON UPDATE no action
      `);
      console.log("✓ 外部キー制約を追加しました");
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes("already exists")
      ) {
        console.log("✓ 外部キー制約は既に存在します");
      } else {
        throw error;
      }
    }

    // インデックスの追加
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "profile_history_user_id_idx" 
        ON "profile_history"("user_id")
      `);
      console.log("✓ user_idインデックスを作成しました");
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes("already exists")
      ) {
        console.log("✓ user_idインデックスは既に存在します");
      } else {
        throw error;
      }
    }

    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "profile_history_recorded_at_idx" 
        ON "profile_history"("recorded_at")
      `);
      console.log("✓ recorded_atインデックスを作成しました");
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes("already exists")
      ) {
        console.log("✓ recorded_atインデックスは既に存在します");
      } else {
        throw error;
      }
    }

    console.log("\n✅ マイグレーションが正常に完了しました！");
    process.exit(0);
  } catch (error) {
    console.error("❌ マイグレーションエラー:", error);
    process.exit(1);
  }
}

runMigration();

