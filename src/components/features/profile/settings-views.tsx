"use client";

import type { LucideIcon } from "lucide-react";
import { SettingsHeader } from "./settings-header";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Monitor, Download, Trash2 } from "lucide-react";

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
          {/* ▼ 修正: p-4 -> p-3 */}
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

// --- 外観モード ---
export function AppearanceSettings({ onBack }: SettingsViewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 min-h-screen bg-gray-50/50 dark:bg-background">
      <SettingsHeader title="テーマ設定" onBack={onBack} />
      <div className="px-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <ThemeCard icon={Sun} label="ライト" active={false} />
          <ThemeCard icon={Moon} label="ダーク" active={false} />
          <ThemeCard icon={Monitor} label="端末設定" active={true} />
        </div>
        <p className="text-xs text-muted-foreground px-1">
          ※現在はシステムのテーマ設定に従います
        </p>
      </div>
    </div>
  );
}

interface ThemeCardProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
}

function ThemeCard({ icon: Icon, label, active }: ThemeCardProps) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-transparent bg-card shadow-sm hover:bg-muted/50"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

// --- アカウント設定 ---
export function AccountSettings({ onBack }: SettingsViewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 min-h-screen bg-gray-50/50 dark:bg-background">
      <SettingsHeader title="アカウント設定" onBack={onBack} />
      <div className="px-4">
        <p className="text-sm text-muted-foreground">開発中です...</p>
      </div>
    </div>
  );
}

// --- データ管理 ---
export function DataSettings({ onBack }: SettingsViewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 min-h-screen bg-gray-50/50 dark:bg-background">
      <SettingsHeader title="データ管理" onBack={onBack} />
      <div className="px-4 space-y-4">
        <Card className="divide-y divide-border/40 border-border/60 shadow-sm">
          {/* ▼ 修正: p-4 -> p-3.5 */}
          <button className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors text-left">
            <div className="space-y-0.5">
              <div className="text-sm font-bold flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                データをエクスポート
              </div>
              <div className="text-xs text-muted-foreground">
                全トレーニング記録をCSV形式でダウンロード
              </div>
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-3.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left group">
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
  );
}
