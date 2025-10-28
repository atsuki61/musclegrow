"use client";

import Link from "next/link";
import { Home, History, Plus, LineChart, User } from "lucide-react";
import { usePathname } from "next/navigation";

export function FooterNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/history", icon: History, label: "履歴" },
    { href: "/record", icon: Plus, label: "記録", isSpecial: true },
    { href: "/stats", icon: LineChart, label: "グラフ" },
    { href: "/profile", icon: User, label: "プロフィール" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isSpecial = item.isSpecial;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center gap-1.5 px-4 py-2
                transition-all duration-200 ease-in-out
                rounded-lg
                ${isActive ? "text-primary" : "text-muted-foreground"}
                ${isActive && !isSpecial ? "bg-primary/5" : ""}
                ${!isActive ? "hover:text-foreground hover:bg-accent/50" : ""}
                `}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
