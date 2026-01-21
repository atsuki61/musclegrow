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
import { toast } from "sonner";

export function GoalsPage() {
  const router = useRouter();

  const [benchPress, setBenchPress] = useState<string>("");//ベンチプレスの目標重量
  const [squat, setSquat] = useState<string>("");//スクワットの目標重量
  const [deadlift, setDeadlift] = useState<string>("");//デッドリフトの目標重量
  const [isLoading, setIsLoading] = useState(true);//ロード中のフラグ
  const [isSaving, setIsSaving] = useState(false);//保存中のフラグ

  useEffect(() => {
    fetchProfile();
  }, []);

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
        toast.error(data.error.message);
      }
    } catch (err) {
      toast.error("目標データの取得に失敗しました");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

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
        // ▼ toast.successに変更
        toast.success("目標を保存しました！");
        setTimeout(() => {
          router.push("/");
        }, 1000); // 遷移を少し早める
      } else {
        toast.error(data.error.message); // toast.errorに変更
      }
    } catch (err) {
      toast.error("目標の保存に失敗しました"); // toast.errorに変更
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

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
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          kg
        </span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 pb-20">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-background min-h-screen pb-20">
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
        <p className="text-sm text-muted-foreground mt-2">
          長期的な目標重量を設定して、モチベーションを維持しましょう
        </p>
      </div>

      {/* 独自メッセージ表示エリアを削除 (Toastが代わりに出るため) */}

      <Card className="p-5 mb-4">
        <h3 className="text-base font-semibold mb-4">目標重量</h3>
        <div className="space-y-4">
          {renderNumberInput(
            "benchPress",
            "ベンチプレス",
            benchPress,
            setBenchPress,
            "100.0",
            "bg-primary"
          )}
          {renderNumberInput(
            "squat",
            "スクワット",
            squat,
            setSquat,
            "100.0",
            "bg-primary"
          )}
          {renderNumberInput(
            "deadlift",
            "デッドリフト",
            deadlift,
            setDeadlift,
            "100.0",
            "bg-primary"
          )}
        </div>
      </Card>

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
