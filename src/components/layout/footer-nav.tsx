"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Plus, BarChart3, User } from "lucide-react";
import { isAuthPage, cn } from "@/lib/utils";

export function FooterNav() {
  const pathname = usePathname();

  // ログインページ等では表示しない
  if (isAuthPage(pathname)) return null;

  const navItems = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/history", icon: CalendarDays, label: "履歴" },
    { href: "/record", icon: Plus, label: "記録", isSpecial: true },
    { href: "/stats", icon: BarChart3, label: "グラフ" },
    { href: "/profile", icon: User, label: "設定" },
  ];

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
      {/* ナビゲーションコンテナ */}
      <nav
        className={cn(
          "pointer-events-auto relative w-full max-w-[380px]",
          "bg-background/90 backdrop-blur-xl",
          "border border-border/50",
          // ▼ 修正: ダークモード時にボーダーをテーマカラーにし、薄く光らせる
          "dark:border-primary/40",
          "shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
          "dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]",
          "dark:shadow-primary/10", // ほんのり色味を足して立体感を出す
          "rounded-3xl px-2 py-3 transition-all duration-300"
        )}
      >
        <ul className="flex justify-between items-end w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            // ▼ 中央の特別な「記録」ボタン
            if (item.isSpecial) {
              return (
                <li
                  key={item.href}
                  className="relative -mt-10 flex justify-center z-10"
                >
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-transform active:scale-95 focus:outline-none"
                  >
                    {/* 光るエフェクト */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full bg-primary/40 blur-xl transition-opacity duration-500",
                        isActive
                          ? "opacity-100"
                          : "opacity-40 group-hover:opacity-70"
                      )}
                    />

                    {/* ボタン本体 */}
                    <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 border-[4px] border-background group-hover:scale-105 transition-all duration-300">
                      <Plus
                        className={cn(
                          "w-8 h-8 stroke-[3px] transition-transform duration-300",
                          isActive ? "rotate-180" : "group-hover:rotate-90"
                        )}
                      />
                    </div>
                  </Link>
                </li>
              );
            }

            // ▼ 通常のメニュー項目
            return (
              <li
                key={item.href}
                className="relative flex flex-1 justify-center"
              >
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className="group flex flex-col items-center justify-end w-full h-12 outline-none touch-manipulation"
                >
                  {/* アイコンラッパー */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center transition-all duration-300 ease-out",
                      isActive
                        ? "-translate-y-2"
                        : "translate-y-1 group-hover:translate-y-0"
                    )}
                  >
                    {/* 背景のハロー効果 */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full bg-primary/10 scale-0 transition-transform duration-300",
                        isActive && "scale-150"
                      )}
                    />
                    <Icon
                      className={cn(
                        "relative w-6 h-6 transition-all duration-300 z-10",
                        isActive
                          ? "text-primary stroke-[2.5px]"
                          : "text-muted-foreground stroke-2 group-hover:text-foreground"
                      )}
                    />
                  </div>

                  {/* ラベルテキスト */}
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-wide mt-1 transition-all duration-300 origin-bottom",
                      isActive
                        ? "text-primary opacity-100 scale-100 translate-y-0"
                        : "text-muted-foreground opacity-0 scale-75 translate-y-2"
                    )}
                  >
                    {item.label}
                  </span>

                  {/* ホバー時のドットインジケーター */}
                  {!isActive && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
