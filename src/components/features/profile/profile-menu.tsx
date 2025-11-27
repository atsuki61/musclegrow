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
  Database,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProfileResponse } from "@/types/profile";

export type ViewStateTarget =
  | "notifications"
  | "appearance"
  | "account"
  | "data"
  | "contact"
  | "terms";

interface ProfileMenuProps {
  profile: ProfileResponse | null;
  onEditBody: () => void;
  onNavigate: (target: ViewStateTarget) => void;
}

export function ProfileMenu({
  profile,
  onEditBody,
  onNavigate,
}: ProfileMenuProps) {
  const router = useRouter();
  const userName = "Traimee User";

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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* 1. ユーザーヘッダー（少し余白を詰める） */}
      <div className="pt-8 pb-4 flex flex-col items-center justify-center space-y-3 bg-gradient-to-b from-background to-muted/20">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 ring-4 ring-background">
            <User className="w-9 h-9" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {userName}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
            ベーシックプラン
          </span>
        </div>
      </div>

      {/* 余白を space-y-8 から space-y-6 に短縮 */}
      <div className="px-4 space-y-6 -mt-2">
        {/* 2. 体組成カード（パディングを p-5 から p-4 に） */}
        <button
          onClick={onEditBody}
          className="w-full bg-card border border-border/60 rounded-2xl p-4 shadow-sm group hover:border-primary/50 transition-all duration-200 active:scale-[0.98] cursor-pointer select-none text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
            <Activity className="w-20 h-20 -mr-6 -mt-6" />
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" /> 体組成データ
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>

          <div className="flex items-end justify-around relative z-10 px-2">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-black tracking-tighter text-foreground">
                  {weight}
                </span>
                <span className="text-xs font-bold text-muted-foreground mb-1">
                  kg
                </span>
              </div>
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                Weight
              </p>
            </div>
            <div className="w-px h-8 bg-border/80" />
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-black tracking-tighter text-foreground">
                  {bodyFat}
                </span>
                <span className="text-xs font-bold text-muted-foreground mb-1">
                  %
                </span>
              </div>
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                Body Fat
              </p>
            </div>
          </div>
        </button>

        {/* 3. 設定リスト（間隔を詰める） */}
        <div className="space-y-5">
          {/* グループ1 */}
          <section className="space-y-1.5">
            <h3 className="px-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
              アプリ設定
            </h3>
            <Card className="border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
              <SettingItem
                icon={Bell}
                label="通知設定"
                onClick={() => onNavigate("notifications")}
              />
              <SettingItem
                icon={Moon}
                label="テーマ設定"
                onClick={() => onNavigate("appearance")}
              />
            </Card>
          </section>

          {/* グループ2 */}
          <section className="space-y-1.5">
            <h3 className="px-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
              アカウント・データ
            </h3>
            <Card className="border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
              <SettingItem
                icon={Settings}
                label="アカウント設定"
                onClick={() => onNavigate("account")}
              />
              <SettingItem
                icon={Database}
                label="データ管理"
                onClick={() => onNavigate("data")}
              />
            </Card>
          </section>

          {/* グループ3 */}
          <section className="space-y-1.5">
            <h3 className="px-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
              サポート
            </h3>
            <Card className="border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
              <SettingItem
                icon={Mail}
                label="お問い合わせ"
                onClick={() => onNavigate("contact")}
              />
              <SettingItem
                icon={FileText}
                label="利用規約・ポリシー"
                onClick={() => onNavigate("terms")}
              />
            </Card>
          </section>
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
      </div>
    </div>
  );
}

interface SettingItemProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

function SettingItem({ icon: Icon, label, onClick }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      // ▼ 修正: px-5 py-4 -> px-4 py-3.5 に変更してコンパクトに
      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-muted/40 transition-all duration-200 active:bg-muted active:scale-[0.99] bg-card cursor-pointer select-none group"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium text-foreground/90">{label}</span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground/50" />
    </button>
  );
}
