"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

/**
 * 認証保護コンポーネント
 *
 * このコンポーネントでラップされたページは、ログインしていない場合
 * 自動的にログインページにリダイレクトされます。
 *
 * 使用例:
 * ```tsx
 * export default function ProtectedPage() {
 *   return (
 *     <AuthGuard>
 *       <div>保護されたコンテンツ</div>
 *     </AuthGuard>
 *   );
 * }
 * ```
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    // セッション情報の読み込み中は何もしない
    if (isPending) {
      return;
    }

    // ログインしていない場合、ログインページにリダイレクト
    if (!session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // ローディング中は何も表示しない（またはローディング表示）
  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  // ログインしていない場合は何も表示しない（リダイレクト中）
  if (!session) {
    return null;
  }

  // ログインしている場合は子コンポーネントを表示
  return <>{children}</>;
}
