// src/components/features/profile/profile-menu.tsx

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
  const userName = "Traimee User"; // 将来的にDBから取得

  // 表示用データ（未設定時はハイフン）
  const weight = profile?.weight ? `${profile.weight}` : "--";
  const bodyFat = profile?.bodyFat ? `${profile.bodyFat}` : "--";

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("ログアウトに失敗しました", error);
    }
  };

  const handleSettingClick = (settingName: string) => {
    console.log(`${settingName} clicked`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* 1. ユーザーヘッダー（センター配置 & 大型化） */}
      <div className="pt-10 pb-6 flex flex-col items-center justify-center space-y-3 bg-gradient-to-b from-background to-muted/20">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 ring-4 ring-background">
            <User className="w-10 h-10" />
          </div>
          {/* 編集ボタン的なバッジ（将来用） */}
          {/* <button className="absolute bottom-0 right-0 p-1.5 bg-background rounded-full shadow-sm border border-border/50 text-muted-foreground">
            <Settings className="w-4 h-4" />
          </button> */}
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {userName}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            ベーシックプラン
          </span>
        </div>
      </div>

      <div className="px-4 space-y-6 -mt-2">
        {/* 2. 体組成カード（数字を強調） */}
        <button
          onClick={onEditBody}
          className="w-full bg-card border border-border/60 rounded-2xl p-5 shadow-sm group hover:border-primary/50 transition-all duration-200 active:scale-[0.98] cursor-pointer select-none text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
            <Activity className="w-24 h-24 -mr-6 -mt-6" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" /> 体組成データ
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>

          <div className="flex items-end justify-around relative z-10 px-2">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black tracking-tighter text-foreground">
                  {weight}
                </span>
                <span className="text-sm font-bold text-muted-foreground mb-1">
                  kg
                </span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                Weight
              </p>
            </div>

            <div className="w-px h-10 bg-border/80" />

            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black tracking-tighter text-foreground">
                  {bodyFat}
                </span>
                <span className="text-sm font-bold text-muted-foreground mb-1">
                  %
                </span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                Body Fat
              </p>
            </div>
          </div>
        </button>

        {/* 3. 設定リスト */}
        <div className="space-y-2">
          <h3 className="px-1 text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
            アプリ設定
          </h3>
          <Card className="border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
            <SettingItem
              icon={Bell}
              label="通知設定"
              onClick={() => handleSettingClick("通知設定")}
            />
            <SettingItem
              icon={Moon}
              label="外観モード"
              onClick={() => handleSettingClick("外観モード")}
            />
            <SettingItem
              icon={Settings}
              label="アカウント設定"
              onClick={() => handleSettingClick("アカウント設定")}
            />
            <SettingItem
              icon={Mail}
              label="お問い合わせ"
              onClick={() => handleSettingClick("お問い合わせ")}
            />
          </Card>
        </div>

        {/* 4. ログアウト */}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full h-14 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 active:bg-red-100 dark:active:bg-red-900/40 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}

// onClickを受け取れるように修正
function SettingItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-all duration-200 active:bg-muted active:scale-[0.99] bg-card cursor-pointer select-none group"
    >
      <div className="flex items-center gap-3.5">
        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-[15px] font-medium text-foreground/90">
          {label}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50" />
    </button>
  );
}
