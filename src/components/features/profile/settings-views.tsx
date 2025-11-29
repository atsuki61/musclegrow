"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { SettingsHeader } from "./settings-header";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Moon,
  Sun,
  Check,
  Palette,
  Smartphone,
  Download,
  Trash2,
  Loader2,
  UserX,
  Mail,
  Lock,
  Chrome,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useColorTheme, type ColorTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { exportAllData } from "@/lib/actions/data-export";
import { deleteUserAllData, deleteUserAccount } from "@/lib/actions/settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SettingsViewProps {
  onBack: () => void;
}

// --- 通知設定 ---
export function NotificationSettings({ onBack }: SettingsViewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 min-h-screen bg-gray-50/50 dark:bg-background">
      <SettingsHeader title="通知設定" onBack={onBack} />
      <div className="px-4 space-y-4">
        <Card className="divide-y divide-border/40 border-border/60 shadow-sm">
          <div className="flex items-center justify-between p-3.5">
            <div className="space-y-0.5">
              <div className="text-sm font-bold">プッシュ通知</div>
              <div className="text-xs text-muted-foreground">
                トレーニングのリマインダーを受け取る
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3.5">
            <div className="space-y-0.5">
              <div className="text-sm font-bold">メール通知</div>
              <div className="text-xs text-muted-foreground">
                週次レポートを受け取る
              </div>
            </div>
            <Switch />
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- テーマ設定 ---
export function AppearanceSettings({ onBack }: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const { color, setColor } = useColorTheme();

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 min-h-screen bg-gray-50/50 dark:bg-background pb-20">
      <SettingsHeader title="テーマ設定" onBack={onBack} />
      <div className="px-4 space-y-6">
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground px-1">
            モード
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <ThemeModeCard
              icon={Sun}
              label="ライト"
              active={theme === "light"}
              onClick={() => setTheme("light")}
            />
            <ThemeModeCard
              icon={Moon}
              label="ダーク"
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
            />
            <ThemeModeCard
              icon={Smartphone}
              label="端末設定"
              active={theme === "system"}
              onClick={() => setTheme("system")}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground px-1 flex items-center gap-2">
            <Palette className="w-3 h-3" /> アクセントカラー
          </h3>
          <Card className="p-4 border-border/60 shadow-sm">
            <div className="grid grid-cols-4 gap-4">
              <ColorSwatch
                color="orange"
                active={color === "orange"}
                onClick={() => setColor("orange")}
              />
              <ColorSwatch
                color="red"
                active={color === "red"}
                onClick={() => setColor("red")}
              />
              <ColorSwatch
                color="blue"
                active={color === "blue"}
                onClick={() => setColor("blue")}
              />
              <ColorSwatch
                color="green"
                active={color === "green"}
                onClick={() => setColor("green")}
              />
              <ColorSwatch
                color="yellow"
                active={color === "yellow"}
                onClick={() => setColor("yellow")}
              />
              <ColorSwatch
                color="purple"
                active={color === "purple"}
                onClick={() => setColor("purple")}
              />
              <ColorSwatch
                color="monochrome"
                active={color === "monochrome"}
                onClick={() => setColor("monochrome")}
              />
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground px-1">
            プレビュー
          </h3>
          <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Check className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="h-2 w-20 bg-primary/20 rounded-full" />
              <div className="h-2 w-32 bg-muted rounded-full" />
            </div>
            <button className="ml-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              ボタン
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

interface ThemeModeCardProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ThemeModeCard({
  icon: Icon,
  label,
  active,
  onClick,
}: ThemeModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
        active
          ? "border-primary bg-primary/5 text-primary shadow-sm"
          : "border-transparent bg-card shadow-sm hover:bg-muted/50 text-muted-foreground"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

interface ColorSwatchProps {
  color: ColorTheme;
  active: boolean;
  onClick: () => void;
}

function ColorSwatch({ color, active, onClick }: ColorSwatchProps) {
  const colorMap: Record<ColorTheme, string> = {
    orange: "bg-orange-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-400",
    purple: "bg-purple-500",
    monochrome: "bg-neutral-800 dark:bg-neutral-100",
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border-2",
          colorMap[color],
          active
            ? "border-primary ring-2 ring-primary/30 scale-110 shadow-md"
            : "border-transparent hover:scale-105 opacity-80 hover:opacity-100"
        )}
      >
        {active && (
          <Check
            className={cn(
              "w-6 h-6",
              color === "yellow" ? "text-black" : "text-white",
              color === "monochrome" ? "text-white dark:text-black" : ""
            )}
          />
        )}
      </div>
      <span
        className={cn(
          "text-[10px] font-bold capitalize transition-colors",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {color === "monochrome" ? "Simple" : color}
      </span>
    </button>
  );
}

// --- アカウント設定 ---
interface AccountSettingsProps extends SettingsViewProps {
  userId?: string;
  email?: string; // メールアドレスを受け取る
}

export function AccountSettings({
  onBack,
  userId,
  email,
}: AccountSettingsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setIsDeleting(true);
    try {
      const result = await deleteUserAccount(userId);
      if (result.success) {
        toast.success("アカウントを削除しました");
        await signOut();
        router.push("/login");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("アカウント削除中にエラーが発生しました");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="animate-in fade-in slide-in-from-right-8 duration-300 min-h-screen bg-gray-50/50 dark:bg-background">
        <SettingsHeader title="アカウント設定" onBack={onBack} />
        <div className="px-4 space-y-6">
          {/* 1. ログイン情報セクション */}
          <section className="space-y-2">
            <h3 className="px-1 text-xs font-bold text-muted-foreground">
              ログイン情報
            </h3>
            <Card className="divide-y divide-border/40 border-border/60 shadow-sm">
              {/* メールアドレス */}
              <button
                onClick={() => toast.info("メールアドレス変更機能は準備中です")}
                className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">メールアドレス</div>
                    <div className="text-xs text-muted-foreground">
                      {email || "未設定"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              </button>

              {/* パスワード変更 */}
              <button
                onClick={() => toast.info("パスワード変更機能は準備中です")}
                className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">パスワードの変更</div>
                    <div className="text-xs text-muted-foreground">
                      定期的な変更を推奨します
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              </button>
            </Card>
          </section>

          {/* 2. 連携アカウントセクション */}
          <section className="space-y-2">
            <h3 className="px-1 text-xs font-bold text-muted-foreground">
              連携アカウント
            </h3>
            <Card className="divide-y divide-border/40 border-border/60 shadow-sm">
              <div className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Chrome className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </div>
                  <div className="text-sm font-medium">Google</div>
                </div>
                {/* 連携状態のスイッチ（仮実装: ONの状態） */}
                <Switch
                  defaultChecked
                  onCheckedChange={() => toast.info("連携解除機能は準備中です")}
                />
              </div>
            </Card>
          </section>

          {/* 3. 危険なエリア */}
          <section className="space-y-2">
            <h3 className="px-1 text-xs font-bold text-red-600/80">
              Danger Zone
            </h3>
            <Card className="border-red-100 dark:border-red-900/30 shadow-sm bg-red-50/30 dark:bg-red-950/10">
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors text-left group"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-bold flex items-center gap-2 text-red-600 group-hover:text-red-700">
                    <UserX className="w-4 h-4" />
                    アカウントを削除
                  </div>
                  <div className="text-xs text-muted-foreground">
                    退会し、すべてのデータを完全に削除します
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-300 group-hover:text-red-500" />
              </button>
            </Card>
          </section>
        </div>
      </div>

      {/* 削除確認ダイアログ (そのまま) */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              本当に退会しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
              <br />
              あなたのプロフィール、これまでのトレーニング記録、設定など、すべてのデータが永久に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              退会する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- データ管理 ---
interface DataSettingsProps extends SettingsViewProps {
  userId: string;
}

export function DataSettings({ onBack, userId }: DataSettingsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.loading("データを準備中...", { id: "export" });

      const csvData = await exportAllData(userId);

      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const blob = new Blob([bom, csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `musclegrow_backup_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("エクスポートが完了しました", { id: "export" });
    } catch (e) {
      console.error(e);
      toast.error("エクスポートに失敗しました", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUserAllData(userId);
      if (result.success) {
        toast.success("すべての記録を削除しました");
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("データ削除中にエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="animate-in fade-in slide-in-from-right-8 duration-300 min-h-screen bg-gray-50/50 dark:bg-background">
        <SettingsHeader title="データ管理" onBack={onBack} />
        <div className="px-4 space-y-4">
          <Card className="divide-y divide-border/40 border-border/60 shadow-sm">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-bold flex items-center gap-2">
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-primary" />
                  )}
                  データをエクスポート
                </div>
                <div className="text-xs text-muted-foreground">
                  全トレーニング記録をCSV形式でダウンロード
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left group"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-bold flex items-center gap-2 text-red-600 group-hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  全データを削除
                </div>
                <div className="text-xs text-muted-foreground">
                  アカウントのすべての記録を完全に削除します
                </div>
              </div>
            </button>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              全データを削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              これまでに記録したトレーニングデータ、体重、体脂肪率などの履歴がすべて削除されます。
              <br />
              <span className="font-bold">
                アカウント自体は削除されません。
              </span>
              <br />
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteData();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
