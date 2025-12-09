import type { ReactNode } from "react";
import { getAuthSession } from "@/lib/auth-session-server";
import { AuthSessionProvider } from "@/lib/auth-session-context";
import { GuestDataMigrator } from "@/components/features/guest-data-migrator";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  // 共通のキャッシュ関数を使用
  const session = await getAuthSession();

  //sessionがない場合も null として許容し、リダイレクトしない
  const userId = session?.user?.id ?? null;

  return (
    <AuthSessionProvider userId={userId}>
      <GuestDataMigrator />
      {children}
    </AuthSessionProvider>
  );
}
