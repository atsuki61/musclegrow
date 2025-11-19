import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AuthSessionProvider } from "@/lib/auth-session-context";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  // Next.js 15 の headers() は Promise
  const h = await headers();

  // BetterAuth 公式のセッション取得
  const session = await auth.api.getSession({
    headers: h,
  });

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  return <AuthSessionProvider userId={userId}>{children}</AuthSessionProvider>;
}
