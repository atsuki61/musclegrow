"use client";

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
} from "lucide-react";
import { useTheme } from "next-themes";
import { useColorTheme, type ColorTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

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
        {/* 1. ダークモード設定 */}
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

        {/* 2. アクセントカラー設定 */}
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

        {/* プレビュー */}
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
  // 表示用の色マッピング
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
