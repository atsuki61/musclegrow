import { createSafeActionClient } from "next-safe-action";
import { getAuthSession } from "@/lib/auth-session-server";

// カスタムエラークラスの定義
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

/**
 * 基本的なSafe Action Client
 * エラーハンドリングを共通化
 */
export const actionClient = createSafeActionClient({
  // エラーハンドリングのカスタマイズ
  handleServerError(e) {
    console.error("Action Error:", e);

    if (e instanceof ActionError) {
      return e.message;
    }

    // デフォルトのエラーメッセージ
    return "サーバーエラーが発生しました。しばらく経ってから再度お試しください。";
  },
});

/**
 * 認証付きAction Client
 * ユーザーIDが取得できない場合はエラーを返すミドルウェアを追加
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    throw new ActionError("ログインが必要です。");
  }

  // 次の処理へユーザーIDを渡す
  return next({ ctx: { userId } });
});
