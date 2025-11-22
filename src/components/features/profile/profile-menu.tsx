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
  const userName = "Traimee User";

  // 表示用データ（未設定時はハイフン）
  const weight = profile?.weight ? `${profile.weight}kg` : "--";
  const bodyFat = profile?.bodyFat ? `${profile.bodyFat}%` : "--";

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
      <div className="p-4 space-y-5">
        {/* 1. ユーザーヘッダー（コンパクト化） */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-background">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight leading-none">
              {userName}
            </h2>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">
              ベーシックプラン
            </p>
          </div>
        </div>

        {/* 2. メインカード（体組成への入り口） */}
        {/* グラフは排除し、数字だけの洗練されたカードに */}
        <button
          onClick={onEditBody}
          className="w-full bg-card border border-border/60 rounded-xl p-4 shadow-sm group hover:border-primary/50 transition-all duration-200 active:scale-[0.98] active:bg-accent/50 cursor-pointer select-none text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
            <Activity className="w-16 h-16 -mr-4 -mt-4" />
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> 体組成データ
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>

          <div className="flex items-baseline gap-6 relative z-10">
            <div>
              <span className="text-2xl font-black tracking-tight">
                {weight}
              </span>
              <span className="text-[10px] text-muted-foreground ml-1">
                体重
              </span>
            </div>
            <div className="w-px h-8 bg-border/60 rotate-12" />
            <div>
              <span className="text-2xl font-black tracking-tight">
                {bodyFat}
              </span>
              <span className="text-[10px] text-muted-foreground ml-1">
                体脂肪
              </span>
            </div>
          </div>
        </button>

        {/* 3. 設定リスト（余白を詰めて一体感を出す） */}
        <div className="space-y-1.5">
          <h3 className="px-1 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
            アプリ設定
          </h3>
          <Card className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40 shadow-sm">
            <SettingItem icon={Bell} label="通知設定" />
            <SettingItem icon={Moon} label="外観モード" />
            <SettingItem icon={Settings} label="アカウント設定" />
            <SettingItem icon={Mail} label="お問い合わせ" />
          </Card>
        </div>

        {/* 4. ログアウト */}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full h-12 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 active:bg-red-100 dark:active:bg-red-900/40 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </Button>

        <p className="text-center text-[10px] text-muted-foreground/40 font-mono">
          v1.2.0
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
    <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-muted/40 transition-all duration-200 active:bg-muted active:scale-[0.99] bg-card cursor-pointer select-none group">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="text-sm font-medium text-foreground/90">{label}</span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground/50" />
    </button>
  );
}
