/**
 * 認証ページ用のレイアウト
 * 
 * このレイアウトは認証ページ（ログイン・サインアップ）で使用されます。
 * Header と Footer を表示しないシンプルなレイアウトです。
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

