"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuthSession } from "@/lib/auth-session-context";
import { cn } from "@/lib/utils";

export const LS_HAS_LOGGED_IN = "mg_has_logged_in";
export const LS_HIDE_LOGIN_PROMPT = "mg_hide_login_prompt";

/**
 * 未ログイン状態を知らせるバナー
 * - 過去にログインしたことがある場合は必ず表示
 * - 初回ゲストの場合は「二度と表示しない」オプションを表示
 * - 設定の「未ログイン時のログイン案内」でも制御可能
 */
export function LoginPromptBanner() {
  const { userId } = useAuthSession();
  const [visible, setVisible] = useState(false);
  const [neverShow, setNeverShow] = useState(false);

  useEffect(() => {
    // ログイン済みの場合: フラグを更新してバナー非表示
    if (userId) {
      localStorage.setItem(LS_HAS_LOGGED_IN, "true");
      return;
    }

    // 未ログイン: 非表示設定を確認
    const hidden = localStorage.getItem(LS_HIDE_LOGIN_PROMPT) === "true";
    if (hidden) return;

    setVisible(true);
  }, [userId]);

  const handleClose = () => {
    if (neverShow) {
      localStorage.setItem(LS_HIDE_LOGIN_PROMPT, "true");
    }
    setVisible(false);
  };

  if (!visible || !!userId) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex items-center justify-center",
        "bg-black/50 animate-in fade-in duration-300"
      )}
    >
      <div className="w-full max-w-[360px] px-4">
        <div className="bg-card border border-primary/30 rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            {/* アイコン + テキスト */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <LogIn className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  ログインしていません
                </p>
                <p className="text-xs text-muted-foreground">
                  記録はクラウドに保存されません
                </p>
              </div>
            </div>

            {/* ログインボタン + 閉じるボタン */}
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" className="h-8 text-xs font-bold" asChild>
                <Link href="/login">ログイン</Link>
              </Button>
              <button
                onClick={handleClose}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 二度と表示しないオプション */}
          <div className="mt-2.5 pt-2.5 border-t border-primary/20 flex items-center gap-2">
            <Checkbox
              id="never-show-login-prompt"
              checked={neverShow}
              onCheckedChange={(checked) => setNeverShow(checked === true)}
            />
            <Label
              htmlFor="never-show-login-prompt"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              二度と表示しない
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
