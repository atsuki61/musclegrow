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
