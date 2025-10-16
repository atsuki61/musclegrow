import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./schemas/auth";
import * as appSchema from "./schemas/app";

// 環境変数からデータベースの接続文字列を取得
const connectionString = process.env.DATABASE_URL!;
// PostgreSQLクライアントを初期化
const client = postgres(connectionString, { prepare: false });
// Drizzle ORMのインスタンスを作成し、エクスポート
export const db = drizzle({
  client,
  schema: {
    ...authSchema,
    ...appSchema,
  },
});
