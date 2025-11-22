"use client";

import {
  User,
  Settings,
  Bell,
  Moon,
  ChevronRight,
  LogOut,
  Activity,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProfileResponse } from "@/types/profile";

interface ProfileMenuProps {
  profile: ProfileResponse | null;
  onEditBody: () => void;
}

export function ProfileMenu({ profile, onEditBody }: ProfileMenuProps) {
  const router = useRouter();

  const weight = profile?.weight ?? "--";
  const bodyFat = profile?.bodyFat ?? "--";
  const userName = "Traimee User";

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("ログアウトに失敗しました", error);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="p-4 space-y-6">
        {/* ユーザー情報カード */}
        <div className="flex items-center gap-4 px-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <User className="w-8 h-8" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{userName}</h2>
            <p className="text-xs text-muted-foreground font-medium">
              ベーシックプラン会員
            </p>
          </div>
        </div>

        {/* メインアクション: 体組成データ編集 */}
        <button
          onClick={onEditBody}
          // 修正点: transition-all duration-200 active:scale-95 active:bg-accent を適用
          className="w-full bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between group hover:border-primary/50 transition-all duration-200 active:scale-95 active:bg-accent cursor-pointer select-none"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm">体組成データ</h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                体重: <span className="text-foreground">{weight}</span>kg /
                体脂肪: <span className="text-foreground">{bodyFat}</span>%
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>

        {/* アプリ設定グループ */}
        <div className="space-y-2">
          <h3 className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            アプリ設定
          </h3>
          <Card className="border border-border rounded-2xl overflow-hidden divide-y divide-border/50 shadow-sm">
            <SettingItem icon={Bell} label="通知設定" />
            <SettingItem icon={Moon} label="外観モード (ダーク)" />
            <SettingItem icon={Settings} label="アカウント設定" />
          </Card>
        </div>

        {/* サポートグループ */}
        <div className="space-y-2">
          <h3 className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            サポート
          </h3>
          <Card className="border border-border rounded-2xl overflow-hidden divide-y divide-border/50 shadow-sm">
            <SettingItem icon={Mail} label="お問い合わせ" />
          </Card>
        </div>

        {/* ログアウトボタン */}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          // 修正点: active:scale-95 active:bg-red-100 dark:active:bg-red-900/40 を適用
          className="w-full py-6 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 active:bg-red-100 dark:active:bg-red-900/40 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </Button>

        <p className="text-center text-[10px] text-muted-foreground/60 pt-4">
          MuscleLog Pro v1.2.0
        </p>
      </div>
    </div>
  );
}

function SettingItem({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    // 修正点: active:scale-[0.97] active:bg-accent を適用
    <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-all duration-200 active:scale-[0.97] active:bg-accent bg-card cursor-pointer select-none">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
    </button>
  );
}
