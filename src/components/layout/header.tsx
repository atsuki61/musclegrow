"use client";

import { usePathname } from "next/navigation";

/**
 * ページパスに応じたタイトルを返す関数
 */
function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    "/history": "履歴",
    "/stats": "グラフ",
    "/profile": "プロフィール",
    // ホーム画面("/") や 記録画面("/record") はこのコンポーネントで表示しないため定義不要
  };

  return titleMap[pathname] || "";
}

export function Header() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  // ホーム画面("/") と 記録ページ("/record") では
  // ページ個別のヘッダー（またはヘッダーなし）のデザインを採用するため、共通ヘッダーは非表示
  if (pathname === "/" || pathname === "/record") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-center px-4 relative">
        <h1 className="text-lg font-bold">{pageTitle}</h1>
      </div>
    </header>
  );
}
