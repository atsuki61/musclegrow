"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

/**
 * ページパスに応じたタイトルを返す関数
 */
function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    "/record": "記録",
    "/history": "履歴",
    "/stats": "グラフ",
    "/profile": "プロフィール",
  };

  return titleMap[pathname] || "MuscleGrow";
}

export function Header() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  // ダミーデータ（将来的にはAPIから取得）
  const totalDays = 180;

  // 記録ページではグローバルなHeaderを非表示（記録ページが独自のHeaderを持つため）
  if (pathname === "/record") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">{pageTitle}</h1>
          {pageTitle === "MuscleGrow" && (
            <Badge
              variant="secondary"
              className="rounded-full text-xs px-1.5 py-0.5 font-medium"
            >
              🔥{totalDays}
            </Badge>
          )}
        </div>
        <button>⚙️</button>
      </div>
    </header>
  );
}
