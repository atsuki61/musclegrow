import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Better AuthへのHTTP入口。
// ログイン画面のsignIn()などは最終的にこのGET / POSTハンドラへ到達し、
// src/lib/auth.tsの設定に従ってユーザー・アカウント・セッションを処理する。
export const { POST, GET } = toNextJsHandler(auth);
