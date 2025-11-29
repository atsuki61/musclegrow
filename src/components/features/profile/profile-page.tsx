"use client";

import { useState, useEffect } from "react";
import type { ProfileResponse } from "@/types/profile";
import { ProfileMenu, type ViewStateTarget } from "./profile-menu";
import { BodyCompositionEditor } from "./body-composition-editor";
import {
  NotificationSettings,
  AppearanceSettings,
  AccountSettings,
  DataSettings,
} from "./settings-views";
import { SettingsHeader } from "./settings-header";
import type { User } from "better-auth";

interface ProfilePageProps {
  initialProfile: ProfileResponse | null;
  user: User;
}

type ViewState = "menu" | "editor" | ViewStateTarget;

interface BodyCompositionData {
  height: number;
  weight: number;
  bodyFat: number;
  muscleMass: number;
}

export function ProfilePage({ initialProfile, user }: ProfilePageProps) {
  const [view, setView] = useState<ViewState>("menu");
  const [profile, setProfile] = useState<ProfileResponse | null>(
    initialProfile
  );
  const [isSaving, setIsSaving] = useState(false);
  // error state は使っていないため削除（ESLint警告対応）

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  const handleSave = async (data: BodyCompositionData) => {
    try {
      setIsSaving(true);

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
        console.error(result.error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => setView("menu");

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
    case "data":
      // ▼ 修正: userIdを渡す
      return <DataSettings onBack={goBack} userId={user.id} />;
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
          user={user}
          onEditBody={() => setView("editor")}
          onNavigate={(target) => setView(target)}
        />
      );
  }
}
