"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getBMIResult, getBMIPercentage } from "@/lib/utils/bmi";
import {
  calculateBodyComposition,
  isBodyCompositionValid,
} from "@/lib/utils/body-composition";
import type { ProfileResponse } from "@/types/profile";

interface ProfilePageProps {
  initialProfile: ProfileResponse | null;
}

/**
 * プロフィール画面コンポーネント（UI案3: ビジュアル重視）
 *
 * BMI計算、体組成の内訳表示、プログレスバーなど、
 * ビジュアル要素を重視したプロフィール画面です。
 */
export function ProfilePage({ initialProfile }: ProfilePageProps) {
  // State管理
  const [profile, setProfile] = useState<ProfileResponse | null>(
    initialProfile
  );
  const [height, setHeight] = useState<string>(
    initialProfile?.height?.toString() ?? ""
  );
  const [weight, setWeight] = useState<string>(
    initialProfile?.weight?.toString() ?? ""
  );
  const [bodyFat, setBodyFat] = useState<string>(
    initialProfile?.bodyFat?.toString() ?? ""
  );
  const [muscleMass, setMuscleMass] = useState<string>(
    initialProfile?.muscleMass?.toString() ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialProfile) {
      setProfile(null);
      setHeight("");
      setWeight("");
      setBodyFat("");
      setMuscleMass("");
      return;
    }

    setProfile(initialProfile);
    setHeight(initialProfile.height?.toString() ?? "");
    setWeight(initialProfile.weight?.toString() ?? "");
    setBodyFat(initialProfile.bodyFat?.toString() ?? "");
    setMuscleMass(initialProfile.muscleMass?.toString() ?? "");
  }, [initialProfile]);

  /**
   * プロフィールを保存
   */
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const requestData = {
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
        muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
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
        setProfile(data.data);
        setSuccessMessage("プロフィールを保存しました");
        // 3秒後に成功メッセージを消す
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError("プロフィールの保存に失敗しました");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // BMI計算（リアルタイム）
  const heightNum = parseFloat(height) || 0;
  const weightNum = parseFloat(weight) || 0;
  const bodyFatNum = parseFloat(bodyFat) || 0;
  const muscleMassNum = parseFloat(muscleMass) || 0;

  const hasBMIData = heightNum > 0 && weightNum > 0;
  const bmiResult = hasBMIData ? getBMIResult(heightNum, weightNum) : null;
  const bmiPercentage = hasBMIData ? getBMIPercentage(bmiResult!.bmi) : 0;

  // 体組成計算
  const hasCompositionData = isBodyCompositionValid(
    weightNum,
    bodyFatNum,
    muscleMassNum
  );
  const composition = hasCompositionData
    ? calculateBodyComposition(weightNum, bodyFatNum, muscleMassNum)
    : null;

  /**
   * 体組成のプログレスバーを表示する
   *
   * @param label ラベル（例: "筋肉量"）
   * @param value 値（kg）
   * @param percentage パーセンテージ（%）
   * @param color プログレスバーの色（Tailwindクラス）
   */
  const renderCompositionBar = (
    label: string,
    value: number,
    percentage: number,
    color: string
  ) => (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">
          {value}kg ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );

  /**
   * 数値入力フィールドを表示する
   *
   * @param id フィールドID
   * @param label ラベル
   * @param value 値
   * @param onChange 変更ハンドラ
   * @param placeholder プレースホルダー
   * @param min 最小値
   * @param max 最大値
   * @param unit 単位（例: "cm", "kg", "%"）
   */
  const renderNumberInput = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder: string,
    min: string,
    max: string,
    unit: string
  ) => (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          className="text-sm pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step="0.1"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
          {unit}
        </span>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-20">
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

      {/* BMI表示カード */}
      {hasBMIData && bmiResult && (
        <Card className="p-4 mb-4 bg-linear-to-br from-blue-50 to-purple-50 border-0">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">あなたのBMI</p>
            <p className="text-4xl font-bold text-blue-600 mb-1">
              {bmiResult.bmi}
            </p>
            <p className="text-xs text-gray-500">{bmiResult.categoryLabel}</p>

            {/* BMI バー */}
            <div className="mt-3 relative">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${bmiPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 体組成データ入力 */}
      <Card className="p-4 mb-4">
        <h3 className="text-base font-semibold mb-3">体組成データ</h3>

        {/* 身長・体重 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {renderNumberInput(
            "height",
            "身長",
            height,
            setHeight,
            "175.5",
            "100",
            "250",
            "cm"
          )}
          {renderNumberInput(
            "weight",
            "体重",
            weight,
            setWeight,
            "70.5",
            "30",
            "300",
            "kg"
          )}
        </div>

        {/* 体脂肪率・筋肉量 */}
        <div className="grid grid-cols-2 gap-3">
          {renderNumberInput(
            "bodyFat",
            "体脂肪率",
            bodyFat,
            setBodyFat,
            "15.5",
            "0",
            "100",
            "%"
          )}
          {renderNumberInput(
            "muscleMass",
            "筋肉量",
            muscleMass,
            setMuscleMass,
            "35.2",
            "0",
            "150",
            "kg"
          )}
        </div>
      </Card>

      {/* 統計情報カード */}
      {hasCompositionData && composition && (
        <Card className="p-4 mb-4">
          <h3 className="text-base font-semibold mb-3">体組成の内訳</h3>

          <div className="space-y-3">
            {renderCompositionBar(
              "筋肉量",
              composition.muscleMass,
              composition.muscleMassPercentage,
              "bg-green-500"
            )}
            {renderCompositionBar(
              "体脂肪",
              composition.fatMass,
              composition.fatMassPercentage,
              "bg-orange-500"
            )}
            {renderCompositionBar(
              "その他（骨・水分等）",
              composition.otherMass,
              composition.otherMassPercentage,
              "bg-blue-500"
            )}
          </div>
        </Card>
      )}

      {/* 保存ボタン */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
        size="lg"
      >
        {isSaving ? "保存中..." : "保存する"}
      </Button>

      {/* 最終更新日時 */}
      {profile && (
        <p className="text-center text-xs text-gray-500 mt-4">
          最終更新:{" "}
          {new Date(profile.updatedAt).toLocaleString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
