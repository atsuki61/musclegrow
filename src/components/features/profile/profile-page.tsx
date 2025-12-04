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
import type { User } from "better-auth";
import { toast } from "sonner";
import { getGuestProfile, saveGuestProfile } from "@/lib/local-storage-profile";

interface ProfilePageProps {
  initialProfile: ProfileResponse | null;
  user: User | null; // null許容に変更
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

  // 初期ロード時、ゲストならローカルストレージから読み込む
  useEffect(() => {
    if (!user && !initialProfile) {
      const guestProfile = getGuestProfile();
      if (guestProfile) {
        setProfile(guestProfile);
      }
    }
  }, [user, initialProfile]);

  const handleSave = async (data: BodyCompositionData) => {
    setIsSaving(true);
    try {
      if (user) {
        // ログイン時: サーバーへ保存
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
          toast.success("プロフィールを更新しました");
        } else {
          console.error(result.error.message);
          toast.error("更新に失敗しました");
        }
      } else {
        // ゲスト時: ローカルストレージへ保存
        const updated = saveGuestProfile(data);
        setProfile(updated);
        setView("menu");
        toast.success("プロフィールを保存しました（ゲスト）");
      }
    } catch (err) {
      console.error(err);
      toast.error("エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => setView("menu");

  // ゲストの場合、特定の設定画面へは遷移させない
  const handleNavigate = (target: ViewStateTarget) => {
    if (!user && (target === "account" || target === "data")) {
      toast.info("この機能を利用するにはログインが必要です");
      return;
    }
    setView(target);
  };

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
      // userがnullの場合はここには来ないはずだが、念のためガード
      if (!user)
        return (
          <ProfileMenu
            profile={profile}
            user={user}
            onEditBody={() => setView("editor")}
            onNavigate={handleNavigate}
          />
        );
      return (
        <AccountSettings onBack={goBack} userId={user.id} email={user.email} />
      );
    case "data":
      if (!user)
        return (
          <ProfileMenu
            profile={profile}
            user={user}
            onEditBody={() => setView("editor")}
            onNavigate={handleNavigate}
          />
        );
      return <DataSettings onBack={goBack} userId={user.id} />;

    case "menu":
    default:
      return (
        <ProfileMenu
          profile={profile}
          user={user}
          onEditBody={() => setView("editor")}
          onNavigate={handleNavigate}
        />
      );
  }
}
