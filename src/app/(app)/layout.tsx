import type { ReactNode } from "react";
import { getAuthSession } from "@/lib/auth-session-server";
import { AuthSessionProvider } from "@/lib/auth-session-context";
import { GuestDataMigrator } from "@/components/features/guest-data-migrator";
import { LoginPromptBanner } from "@/components/features/login-prompt/login-prompt-banner";

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * メインアプリ用レイアウト（ゲスト利用可）
 * - 未ログインでもページは表示する（リダイレクトしない）
 * - userId は AuthSessionProvider 経由で子コンポーネントへ渡す
 * - DB への保存は Server Action / フック側で userId 必須
 */
export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getAuthSession();
  const userId = session?.user?.id ?? null;

  return (
    <AuthSessionProvider userId={userId}>
      <GuestDataMigrator />
      <LoginPromptBanner />
      {children}
    </AuthSessionProvider>
  );
}
