"use client";

import { useState, useSyncExternalStore } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import { getGuestProfile } from "@/lib/local-storage-profile";

export type Big3TargetFormValues = {
  benchPress: string;
  squat: string;
  deadlift: string;
};

interface GoalsPageProps {
  /** ログインユーザー向け: サーバーで取得済みの BIG3 目標 */
  initialTargets: Big3TargetFormValues | null;
  userId: string | null;
}

function getGuestBig3Targets(): Big3TargetFormValues | null {
  const guestProfile = getGuestProfile();
  if (!guestProfile) return null;

  return {
    benchPress: guestProfile.big3TargetBenchPress?.toString() ?? "",
    squat: guestProfile.big3TargetSquat?.toString() ?? "",
    deadlift: guestProfile.big3TargetDeadlift?.toString() ?? "",
  };
}

export function GoalsPage({ initialTargets, userId }: GoalsPageProps) {
  const router = useRouter();

  const guestBig3Targets = useSyncExternalStore(
    () => () => {},
    getGuestBig3Targets,
    () => null
  );

  const baseTargets = initialTargets ?? (!userId ? guestBig3Targets : null);

  const [benchPress, setBenchPress] = useState(
    baseTargets?.benchPress ?? ""
  );
  const [squat, setSquat] = useState(baseTargets?.squat ?? "");
  const [deadlift, setDeadlift] = useState(baseTargets?.deadlift ?? "");
  const [hydratedTargetsKey, setHydratedTargetsKey] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const targetsKey = baseTargets
    ? `${baseTargets.benchPress}|${baseTargets.squat}|${baseTargets.deadlift}`
    : null;

  if (targetsKey !== null && targetsKey !== hydratedTargetsKey) {
    setHydratedTargetsKey(targetsKey);
    setBenchPress(baseTargets?.benchPress ?? "");
    setSquat(baseTargets?.squat ?? "");
    setDeadlift(baseTargets?.deadlift ?? "");
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const requestData = {
        big3TargetBenchPress: benchPress ? parseFloat(benchPress) : undefined,
        big3TargetSquat: squat ? parseFloat(squat) : undefined,
        big3TargetDeadlift: deadlift ? parseFloat(deadlift) : undefined,
      };

      const result = await updateProfile(requestData);

      if (result.success) {
        toast.success("目標を保存しました！");
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        toast.error(result.error ?? "更新に失敗しました");
      }
    } catch (err) {
      toast.error("目標の保存に失敗しました");
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
