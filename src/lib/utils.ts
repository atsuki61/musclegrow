import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays}日${diffHours}時間前`;
  }
  return `${diffHours}時間前`;
}
