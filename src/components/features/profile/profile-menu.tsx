"use client";

import { useState } from "react";
import {
  User as UserIcon,
  Settings,
  Bell,
  Moon,
  ChevronRight,
  LogOut,
  Activity,
  Mail,
  Database,
  FileText,
  Pencil,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { ProfileResponse } from "@/types/profile";
import type { User } from "better-auth";
// ▼ 追加
import { toast } from "sonner";

export type ViewStateTarget =
  | "notifications"
  | "appearance"
  | "account"
  | "data"
  | "contact"
  | "terms";

interface ProfileMenuProps {
  profile: ProfileResponse | null;
  user: User;
  onEditBody: () => void;
  onNavigate: (target: ViewStateTarget) => void;
}

export function ProfileMenu({
  profile,
  user,
  onEditBody,
  onNavigate,
}: ProfileMenuProps) {
  const router = useRouter();

  const [userName, setUserName] = useState(user.name);
  const [userImage, setUserImage] = useState(user.image);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [isUpdating, setIsUpdating] = useState(false);

  const weight = profile?.weight ? `${profile.weight}` : "--";
  const bodyFat = profile?.bodyFat ? `${profile.bodyFat}` : "--";

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
      // ▼ 追加: ログアウト時のフィードバック
      toast.success("ログアウトしました");
    } catch (error) {
      console.error("ログアウトに失敗しました", error);
      toast.error("ログアウトに失敗しました");
    }
  };

  // 名前更新処理
  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    setIsUpdating(true);
    try {
      await authClient.updateUser({
        name: editName,
      });

      setUserName(editName);
      setIsEditOpen(false);
      router.refresh();
      // ▼ 変更: alert -> toast
      toast.success("プロフィールを更新しました");
    } catch (error) {
      console.error("プロフィールの更新に失敗しました", error);
      // ▼ 変更: alert -> toast
      toast.error("更新に失敗しました");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
        {/* 1. ユーザーヘッダー */}
        <div className="pt-12 pb-6 flex flex-col items-center justify-center space-y-3 bg-gradient-to-b from-background to-muted/20">
          <div className="relative group">
            {/* アバターアイコン */}
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-primary to-primary/60 shadow-xl shadow-primary/20 ring-4 ring-background overflow-hidden">
              <Avatar className="w-full h-full rounded-full border-2 border-background">
                {userImage ? (
                  <AvatarImage
                    src={userImage}
                    alt={userName}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-background text-primary font-bold text-2xl">
                  {userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* 編集ボタン */}
            <button
              onClick={() => {
                setEditName(userName);
                setIsEditOpen(true);
              }}
              className="absolute bottom-0 right-0 p-2 bg-background rounded-full shadow-sm border border-border/50 text-muted-foreground hover:text-primary hover:border-primary transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
              {userName}
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
              ベーシックプラン
            </span>
          </div>
        </div>

        <div className="px-4 space-y-8 -mt-2">
          {/* 2. 体組成カード */}
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
          <div className="space-y-6">
            {/* グループ1: アプリ設定 */}
            <section className="space-y-2">
              <h3 className="px-2 text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
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

            {/* グループ2: アカウント・データ */}
            <section className="space-y-2">
              <h3 className="px-2 text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
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

            {/* グループ3: サポート */}
            <section className="space-y-2">
              <h3 className="px-2 text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
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
            className="w-full h-14 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 active:bg-red-100 dark:active:bg-red-900/40 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </Button>
        </div>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>プロフィールの編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              {/* 画像変更エリア (現在はダミー) */}
              <div className="relative group cursor-not-allowed opacity-80">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={userImage || ""} />
                  <AvatarFallback>
                    {userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* 将来的にここに画像アップロード機能を追加 */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white font-bold">
                    変更不可
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">ユーザー名</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="表示名を入力"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                キャンセル
              </Button>
            </DialogClose>
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdating || !editName.trim()}
              className="flex-1"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
