/**
 * データソース判定のユーティリティ
 * ログイン状態に応じてDBのみ or マージを決定
 */

const GUEST_DATA_MIGRATED_KEY = "guest_data_migrated";

/**
 * ログイン済みユーザーがDBのみを参照すべきかを判定
 *
 * - 未ログイン: false（ローカルストレージを使用）
 * - ログイン済み + 移行未完了: false（従来通りマージ）
 * - ログイン済み + 移行完了: true（DBのみ参照）
 *
 * @param userId ユーザーID（null = 未ログイン）
 * @returns DBのみを参照すべきならtrue
 */
export function shouldUseDbOnly(userId: string | null): boolean {
  // 未ログインはローカルストレージを使用
  if (!userId) return false;

  // SSR時はDBのみを参照（ローカルストレージにアクセスできない）
  if (typeof window === "undefined") return true;

  // ログイン済みで移行完了済みならDBのみ
  return localStorage.getItem(GUEST_DATA_MIGRATED_KEY) === "true";
}

