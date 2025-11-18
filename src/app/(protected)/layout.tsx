import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAuthSession } from "@/lib/auth-session-server";
import { AuthSessionProvider } from "@/lib/auth-session-context";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  return <AuthSessionProvider userId={userId}>{children}</AuthSessionProvider>;
}

