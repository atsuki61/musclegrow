"use client";

import { useState, useEffect } from "react";
import type { ProfileResponse } from "@/types/profile";
import { ProfileMenu } from "./profile-menu";
import { BodyCompositionEditor } from "./body-composition-editor";

interface ProfilePageProps {
  initialProfile: ProfileResponse | null;
}

type ViewState = "menu" | "editor";

/**
 * プロフィール画面コンポーネント（リニューアル版）
 *
 * 設定画面風のメニュー（Hub）と、体組成データ編集画面を切り替えて表示します。
 */
export function ProfilePage({ initialProfile }: ProfilePageProps) {
  // 画面切り替えの状態管理
  const [view, setView] = useState<ViewState>("menu");

  // プロフィールデータの状態管理
  const [profile, setProfile] = useState<ProfileResponse | null>(
    initialProfile
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期データ同期
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  /**
   * プロフィール保存処理
   * BodyCompositionEditorから呼ばれる
   */
  const handleSave = async (data: {
    height: number;
    weight: number;
    bodyFat: number;
    muscleMass: number;
  }) => {
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
        // 保存成功したらメニューに戻る
        setView("menu");
      } else {
        setError(result.error.message);
        // ここでToastなどを出すと親切です
        console.error(result.error.message);
      }
    } catch (err) {
      setError("プロフィールの保存に失敗しました");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // エラー表示（簡易的）
  if (error) {
    // ※必要に応じてよりリッチなエラー表示に変更してください
  }

  // 画面の切り替え
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background">
      {view === "menu" ? (
        <ProfileMenu profile={profile} onEditBody={() => setView("editor")} />
      ) : (
        <BodyCompositionEditor
          initialData={profile}
          onSave={handleSave}
          onCancel={() => setView("menu")}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
