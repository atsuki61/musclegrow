"use client";

import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Settings, LogOut } from "lucide-react";
import { isAuthPage } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

/**
 * ページパスに応じたタイトルを返す関数
 */
function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    "/record": "記録",
    "/history": "履歴",
    "/stats": "グラフ",
    "/profile": "プロフィール",
    "/goals": "目標設定",
  };

  return titleMap[pathname] || "MuscleGrow";
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  // ダミーデータ（将来的にはAPIから取得）
  const totalDays = 180;

  // 記録ページではグローバルなHeaderを非表示（記録ページが独自のHeaderを持つため）
  if (pathname === "/record") {
    return null;
  }

  // 認証ページではHeaderを非表示
  if (isAuthPage(pathname)) {
    return null;
  }

  /**
   * ログアウト処理
   */
  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  /**
   * 設定ボタンのクリック処理（見た目のみ）
   */
  const handleSettings = () => {
    // TODO: 設定ページ実装時にリンク先を追加
    alert("設定機能は今後実装予定です");
  };

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

        {/* ハンバーガーメニュー */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <SheetHeader>
              <SheetTitle>メニュー</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-1">
              {/* 設定（見た目のみ） */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="lg"
                onClick={handleSettings}
              >
                <Settings className="h-5 w-5 mr-3" />
                設定
              </Button>

              {/* 区切り線 */}
              <div className="my-4 border-t" />

              {/* ログアウト */}
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                size="lg"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5 mr-3" />
                ログアウト
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
