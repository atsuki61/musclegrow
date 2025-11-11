import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BodyPart, Exercise } from "@/types/workout";

/**
 * 部位名のラベル定義
 */
export const BODY_PART_LABELS: Record<BodyPart, string> = {
  all: "全て",
  chest: "胸",
  back: "背中",
  legs: "脚",
  shoulders: "肩",
  arms: "腕",
  core: "腹筋",
  other: "その他",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 有酸素種目かどうかを判定する
 * 有酸素種目は重さを扱わないため、MAX重量の表示やセット記録の入力フォームが異なる
 * @param exercise 種目情報
 * @returns 有酸素種目の場合true、筋トレ種目の場合false
 */
export function isCardioExercise(exercise: Exercise): boolean {
  return exercise.bodyPart === "other";
}

/**
 * 時間ベースの種目かどうかを判定する
 * プランクなど、重量や回数ではなく時間で記録する種目
 * @param exercise 種目情報
 * @returns 時間ベース種目の場合true、それ以外はfalse
 */
export function isTimeBasedExercise(exercise: Exercise): boolean {
  const timeBasedKeywords = ["プランク", "plank"];
  return timeBasedKeywords.some((keyword) =>
    exercise.name.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 重量入力が必要な種目かどうかを判定する
 * 有酸素種目や時間ベース種目では重量入力が不要
 * 自重種目や腹筋種目でも重量入力欄は表示されるが、入力は任意
 * @param exercise 種目情報
 * @returns 重量入力が必要な場合true、不要な場合false
 */
export function requiresWeightInput(exercise: Exercise): boolean {
  // 有酸素種目は重量不要
  if (isCardioExercise(exercise)) return false;
  // 時間ベース種目は重量不要
  if (isTimeBasedExercise(exercise)) return false;
  // それ以外は重量入力欄を表示（自重種目や腹筋種目でも任意入力として表示）
  return true;
}

/**
 * 自重種目かどうかを判定する
 * @param exercise 種目情報
 * @returns 自重種目の場合true、それ以外はfalse
 */
export function isBodyweightExercise(exercise: Exercise): boolean {
  return exercise.primaryEquipment === "bodyweight";
}

/**
 * 1RM（1レップ最大値）を計算する
 * Epley式を使用: 1RM = 重量 × (1 + 回数 / 30)
 * @param weight 重量（kg）
 * @param reps 回数
 * @returns 1RM（kg）、計算できない場合はnull
 */
export function calculate1RM(weight: number, reps: number): number | null {
  // 重量または回数が0以下の場合は計算不可
  if (weight <= 0 || reps <= 0) {
    return null;
  }

  // 回数が1の場合はそのまま重量を返す
  if (reps === 1) {
    return weight;
  }

  // Epley式で計算
  const oneRM = weight * (1 + reps / 30);

  // 小数点第1位で四捨五入
  return Math.round(oneRM * 10) / 10;
}

/**
 * 最後のトレーニングからの経過時間をテキスト形式で返す
 * @param lastTrainedAt 最後のトレーニング日時（未設定の場合はundefined）
 * @returns 経過時間のテキスト（例: "12日5時間前"、"初回"）
 */
export function getLastTrainedText(lastTrainedAt?: Date): string {
  if (!lastTrainedAt) return "初回";
  const now = new Date();
  const diffMs = now.getTime() - lastTrainedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diffDays > 0) {
    return `${diffDays}日${diffHours}時間前`;
  }
  return `${diffHours}時間前`;
}
