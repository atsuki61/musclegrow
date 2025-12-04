import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isAfter, startOfDay } from "date-fns";
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

/**
 * 部位別の色定義（Tailwind CSSクラス）
 */
export const BODY_PART_COLORS: Record<BodyPart, string> = {
  all: "bg-gray-100",
  chest: "bg-red-500",
  back: "bg-blue-500",
  legs: "bg-green-500",
  shoulders: "bg-yellow-500",
  arms: "bg-purple-500",
  core: "bg-orange-500",
  other: "bg-gray-500",
};

/**
 * 部位別の色定義（HEX値）
 * カレンダーの描画に使用
 */
export const BODY_PART_COLOR_HEX: Record<Exclude<BodyPart, "all">, string> = {
  chest: "#ef4444",
  back: "#3b82f6",
  legs: "#22c55e",
  shoulders: "#eab308",
  arms: "#a855f7",
  core: "#f97316",
  other: "#6b7280",
};

/**
 * HEX色をRGBAに変換する関数
 * @param hex HEX色コード（例: "#ef4444"）
 * @param opacity 透明度（0.0～1.0、デフォルト: 0.15）
 * @returns RGBA色コード（例: "rgba(239, 68, 68, 0.15)"）
 */
export function getLightBackgroundColor(
  hex: string,
  opacity: number = 0.15
): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 有酸素種目かどうかを判定する
 */
export function isCardioExercise(exercise: Exercise): boolean {
  return exercise.bodyPart === "other";
}

/**
 * 時間ベースの種目かどうかを判定する
 */
export function isTimeBasedExercise(exercise: Exercise): boolean {
  const timeBasedKeywords = ["プランク", "plank"];
  return timeBasedKeywords.some((keyword) =>
    exercise.name.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 重量入力が必要な種目かどうかを判定する
 */
export function requiresWeightInput(exercise: Exercise): boolean {
  if (isCardioExercise(exercise)) return false;
  if (isTimeBasedExercise(exercise)) return false;
  return true;
}

/**
 * 自重種目かどうかを判定する
 */
export function isBodyweightExercise(exercise: Exercise): boolean {
  return exercise.primaryEquipment === "bodyweight";
}

/**
 * 1RM（1レップ最大値）を計算する
 */
export function calculate1RM(weight: number, reps: number): number | null {
  if (weight <= 0 || reps <= 0) {
    return null;
  }
  if (reps === 1) {
    return weight;
  }
  const oneRM = weight * (1 + reps / 30);
  return Math.round(oneRM * 10) / 10;
}

/**
 * 最後のトレーニングからの経過時間をテキスト形式で返す
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

/**
 * DateオブジェクトをYYYY-MM-DD形式の文字列に変換する
 */
export function formatDateToYYYYMMDD(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * 認証ページかどうかを判定する
 */
export function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}

/**
 * 未来の日付かどうかを判定する
 */
export function isFutureDate(
  date: Date,
  referenceDate: Date = new Date()
): boolean {
  return isAfter(startOfDay(date), startOfDay(referenceDate));
}

export function getExerciseById(
  exerciseId: string,
  exercises: Exercise[]
): Exercise | undefined {
  return exercises.find((e) => e.id === exerciseId);
}
