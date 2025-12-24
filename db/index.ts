import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./schemas/auth";
import * as appSchema from "./schemas/app";

// データベース接続の遅延初期化
let dbInstance: ReturnType<typeof drizzle> | null = null;
let postgresClient: ReturnType<typeof postgres> | null = null;

/**
 * データベース接続を初期化する
 * 環境変数が設定されていない場合はエラーをスロー
 */
function initializeDb() {
  if (dbInstance) {
    return dbInstance;
  }

  // 環境変数からデータベースの接続文字列を取得
  let connectionString = process.env.DATABASE_URL;

  // 環境変数が設定されていない場合のエラーハンドリング
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL環境変数が設定されていません。.env.localファイルにDATABASE_URLを設定してください。"
    );
  }

  // 環境変数の値に "DATABASE_URL=" という接頭辞が含まれている場合を処理
  // これは環境変数の設定ミスを防ぐための処理
  if (connectionString.startsWith("DATABASE_URL=")) {
    connectionString = connectionString.replace(/^DATABASE_URL=/, "");
  }

  // URLの形式を検証
  try {
    new URL(connectionString);
  } catch {
    throw new Error(
      `DATABASE_URLの形式が無効です: ${connectionString.substring(0, 20)}...`
    );
  }

  // PostgreSQLクライアントを初期化（Supabaseクラウド版ではSSL接続が必要）
  postgresClient = postgres(connectionString, {
    prepare: false, //vercelの場合はfalseにする(接続が切れる為)
    ssl: "require",
    max: 1,
  });

  // Drizzle ORMのインスタンスを作成
  dbInstance = drizzle({
    client: postgresClient,
    schema: {
      ...authSchema, //ユーザー情報
      ...appSchema, //アプリデータ
    },
  });

  return dbInstance;
}

/**
 * データベースインスタンスを取得する（遅延初期化）
 * 実際に使用されるまで初期化されない
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = initializeDb(); //データベースインスタンスを取得する
    return (instance as unknown as Record<string, unknown>)[prop as string]; //インスタンスを取得する
  },
});
