"use client";

import { User } from "lucide-react";

interface LoginStatusBadgeProps {
  isLoggedIn: boolean;
  userName?: string | null;
}

export function LoginStatusBadge({
  isLoggedIn,
  userName,
}: LoginStatusBadgeProps) {
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
        <User className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-medium text-primary">
          {userName || "ログイン中"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
        ゲスト
      </span>
    </div>
  );
}
