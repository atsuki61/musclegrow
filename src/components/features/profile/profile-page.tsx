"use client";

import { useState, useEffect } from "react";
import type { ProfileResponse } from "@/types/profile";
import { ProfileMenu, type ViewStateTarget } from "./profile-menu";
import { BodyCompositionEditor } from "./body-composition-editor";
import {
  NotificationSettings,
  AppearanceSettings,
  AccountSettings,
  DataSettings, // 新規作成
} from "./settings-views";
import { SettingsHeader } from "./settings-header";

interface ProfilePageProps {
  initialProfile: ProfileResponse | null;
}

type ViewState = "menu" | "editor" | ViewStateTarget;

interface BodyCompositionData {
  height: number;
  weight: number;
  bodyFat: number;
  muscleMass: number;
}

export function ProfilePage({ initialProfile }: ProfilePageProps) {
  const [view, setView] = useState<ViewState>("menu");
  const [profile, setProfile] = useState<ProfileResponse | null>(
    initialProfile
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  const handleSave = async (data: BodyCompositionData) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        setView("menu");
      } else {
        setError(result.error.message);
        console.error(result.error.message);
      }
    } catch (err) {
      setError("プロフィールの保存に失敗しました");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => setView("menu");

  // 画面のレンダリング振り分け
  switch (view) {
    case "editor":
      return (
        <BodyCompositionEditor
          initialData={profile}
          onSave={handleSave}
          onCancel={goBack}
          isSaving={isSaving}
        />
      );
    case "notifications":
      return <NotificationSettings onBack={goBack} />;
    case "appearance":
      return <AppearanceSettings onBack={goBack} />;
    case "account":
      return <AccountSettings onBack={goBack} />;
    case "data": // 新規: データ管理
      return <DataSettings onBack={goBack} />;
    case "contact":
      return (
        <div className="min-h-screen bg-background">
          <SettingsHeader title="お問い合わせ" onBack={goBack} />
          <div className="p-4">
            <p className="text-muted-foreground">フォーム準備中...</p>
          </div>
        </div>
      );
    case "terms":
      return (
        <div className="min-h-screen bg-background">
          <SettingsHeader title="利用規約・ポリシー" onBack={goBack} />
          <div className="p-4">
            <p className="text-muted-foreground">規約準備中...</p>
          </div>
        </div>
      );

    case "menu":
    default:
      return (
        <ProfileMenu
          profile={profile}
          onEditBody={() => setView("editor")}
          onNavigate={(target) => setView(target)}
        />
      );
  }
}
