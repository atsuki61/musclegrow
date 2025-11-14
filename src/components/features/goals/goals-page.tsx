"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * BIG3目標設定ページコンポーネント
 *
 * ユーザーのBIG3（ベンチプレス、スクワット、デッドリフト）の
 * 目標重量を設定・編集するための専用画面です。
 */
export function GoalsPage() {
  const router = useRouter();

  // State管理
  const [benchPress, setBenchPress] = useState<string>("");
  const [squat, setSquat] = useState<string>("");
  const [deadlift, setDeadlift] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // プロフィールデータの取得
  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * プロフィールデータを取得してフォームに設定
   */
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/profile");
      const data = await response.json();

      if (data.success) {
        setBenchPress(data.data.big3TargetBenchPress?.toString() ?? "");
        setSquat(data.data.big3TargetSquat?.toString() ?? "");
        setDeadlift(data.data.big3TargetDeadlift?.toString() ?? "");
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError("目標データの取得に失敗しました");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * BIG3目標を保存
   */
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const requestData = {
        big3TargetBenchPress: benchPress ? parseFloat(benchPress) : undefined,
        big3TargetSquat: squat ? parseFloat(squat) : undefined,
        big3TargetDeadlift: deadlift ? parseFloat(deadlift) : undefined,
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("目標を保存しました");
        // 1.5秒後にホーム画面にリダイレクト
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError("目標の保存に失敗しました");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 数値入力フィールドを表示する
   *
   * @param id フィールドID
   * @param label ラベル
   * @param value 値
   * @param onChange 変更ハンドラ
   * @param placeholder プレースホルダー
   * @param color 色（BIG3の種目色）
   */
  const renderNumberInput = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder: string,
    color: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <div
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${color}`}
        />
        <Input
          id={id}
          type="number"
          className="pl-10 pr-12"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min="0"
          max="1000"
          step="0.5"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          kg
        </span>
      </div>
    </div>
  );

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="p-4 space-y-4 pb-20">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-20">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">BIG3 目標設定</h1>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          長期的な目標重量を設定して、モチベーションを維持しましょう
        </p>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600">
          {successMessage}
        </div>
      )}

      {/* 目標入力カード */}
      <Card className="p-5 mb-4">
        <h3 className="text-base font-semibold mb-4">目標重量</h3>
        <div className="space-y-4">
          {renderNumberInput(
            "benchPress",
            "ベンチプレス",
            benchPress,
            setBenchPress,
            "100.0",
            "bg-red-500"
          )}
          {renderNumberInput(
            "squat",
            "スクワット",
            squat,
            setSquat,
            "120.0",
            "bg-green-500"
          )}
          {renderNumberInput(
            "deadlift",
            "デッドリフト",
            deadlift,
            setDeadlift,
            "140.0",
            "bg-blue-500"
          )}
        </div>
      </Card>

      {/* 保存ボタン */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
        size="lg"
      >
        {isSaving ? "保存中..." : "目標を保存"}
      </Button>
    </div>
  );
}
