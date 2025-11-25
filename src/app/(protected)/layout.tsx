import { redirect } from "next/navigation";
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
  // 共通のキャッシュ関数を使用（これで page.tsx と結果が共有される）
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  return (
    <AuthSessionProvider userId={userId}>
      <GuestDataMigrator />
      {children}
    </AuthSessionProvider>
  );
}
