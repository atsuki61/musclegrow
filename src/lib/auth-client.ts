import { createAuthClient } from "better-auth/react";
import { getBaseURL } from "@/lib/get-base-url";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "@/lib/auth";

/**
 * Better Auth クライアントインスタンス
 * - サーバー側の auth 設定から型を推論し、型安全な認証操作を提供
 * - baseURL は環境に応じて自動切り替え（開発/本番）
 */
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [inferAdditionalFields<typeof auth>()],
});

// ここで扱うのはブラウザから認証APIを呼ぶためのクライアント。
// ログイン後の本人確認は、Server Action側でCookieからセッションを再取得して行う。
// Client Componentから渡されたuserIdは書き換え可能なので、認可には使用しない。

/**
 * Better Auth クライアントの認証操作
 * - signIn: ログイン（メール/パスワード、Google OAuth）
 * - signOut: ログアウト
 * - signUp: 新規登録
 */
export const { signIn, signOut, signUp } = authClient;
