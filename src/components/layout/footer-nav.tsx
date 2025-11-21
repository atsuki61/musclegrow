"use client";

import Link from "next/link";
import { Home, History, Plus, LineChart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { isAuthPage } from "@/lib/utils";

export function FooterNav() {
  const pathname = usePathname();

  if (isAuthPage(pathname)) return null;

  const navItems = [
    { href: "/", icon: Home },
    { href: "/history", icon: History },
    { href: "/record", icon: Plus, isSpecial: true },
    { href: "/stats", icon: LineChart },
    { href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50 md:left-0 md:right-0 md:max-w-md md:mx-auto">
      <div
        className="
          flex justify-around items-center
          py-3 px-3
          bg-background/80 backdrop-blur-xl
          rounded-full shadow-2xl border
          ring-1 ring-black/5
        "
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isSpecial = item.isSpecial;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-label={item.href}
              className="relative flex items-center justify-center w-12 h-12"
            >
              {/* ▼ Glow（通常アイコン） */}
              {!isSpecial && (
                <div
                  className={`
                    absolute inset-0 rounded-full
                    transition-all duration-300
                    ${
                      isActive
                        ? "scale-150 bg-primary/15 blur-xl opacity-80"
                        : "scale-0"
                    }
                  `}
                />
              )}

              {/* ▼ Glow（中央ボタン） */}
              {isSpecial && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="
        relative w-full h-full
        after:content-['']
        after:absolute
        after:inset-0
        after:rounded-full
        after:bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.35)_0%,rgba(var(--primary-rgb),0)_70%)]
        after:scale-[2.2]
        after:translate-y-[12%]
        after:blur-2xl
        after:opacity-90
        after:transition-all after:duration-300
      "
                  />
                </div>
              )}

              {isSpecial ? (
                <div
                  className="
                    relative
                    bg-primary text-primary-foreground
                    rounded-full
                    p-3 shadow-xl
                    -translate-y-4
                    border-4 border-background
                    transition-all duration-300
                    active:scale-95 active:brightness-95
                  "
                >
                  <Icon className="h-7 w-7" />
                </div>
              ) : (
                <>
                  <Icon
                    className={`
                      relative z-1
                      ${
                        isActive
                          ? "h-7 w-7 text-primary"
                          : "h-6 w-6 text-muted-foreground"
                      }
                      transition-all duration-200
                    `}
                  />

                  {isActive && (
                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
