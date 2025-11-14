/**
 * BIG3目標値カラム追加マイグレーションスクリプト
 * 使用方法: pnpm tsx scripts/add-big3-targets-migration.ts
 */

import { config } from "dotenv";
import { db } from "../db";
import { sql } from "drizzle-orm";

// .env.localファイルを読み込む
config({ path: ".env.local" });

/**
 * カラム追加処理を実行する
 *
 * @param columnName 追加するカラム名（信頼できる値のみ）
 */
async function addColumn(columnName: string): Promise<void> {
  try {
    // カラム名は信頼できる値のみを受け入れる
    const validColumns = [
      "big3_target_bench_press",
      "big3_target_squat",
      "big3_target_deadlift",
    ];
    if (!validColumns.includes(columnName)) {
      throw new Error(`無効なカラム名: ${columnName}`);
    }

    // sqlタグを使用してSQLを実行（カラム名は検証済みのため安全）
    await db.execute(
      sql.raw(
        `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "${columnName}" numeric(6, 1)`
      )
    );
    console.log(`✓ ${columnName}カラムを追加しました`);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("already exists") ||
        error.message.includes("duplicate"))
    ) {
      console.log(`✓ ${columnName}カラムは既に存在します`);
    } else {
      throw error;
    }
  }
}

async function runMigration() {
  try {
    console.log("BIG3目標値カラム追加マイグレーションを開始します...");

    // BIG3目標値カラムを追加
    const columns = [
      "big3_target_bench_press",
      "big3_target_squat",
      "big3_target_deadlift",
    ];

    for (const columnName of columns) {
      await addColumn(columnName);
    }

    console.log("\n✅ マイグレーションが正常に完了しました！");
    process.exit(0);
  } catch (error) {
    console.error("❌ マイグレーションエラー:", error);
    process.exit(1);
  }
}

runMigration();

