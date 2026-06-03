import { Metadata } from "next";
import { RecordPage } from "@/components/features/record";
import { getAuthUserId } from "@/lib/auth-session-server";
import { getExercises } from "@/lib/api";
import { getExercisesWithUserPreferences } from "@/lib/actions/user-exercises";
import type { Exercise } from "@/types/workout";


export const metadata: Metadata = {
  title: "記録 | MuscleGrow",
  description: "トレーニングを記録します",
};

export default async function Page() {
  // ユーザーIDを取得
  const userId = await getAuthUserId();

let initialExercises: Exercise[] = [];//種目リスト

if (userId) {
  // ログインユーザー: ユーザー設定を反映した種目リストを取得
  const result = await getExercisesWithUserPreferences(userId);
  initialExercises = result.success ? result.data ?? [] : [];
} else {
  // ゲスト: マスター種目一覧（クライアント側でLSとマージ）
  const result = await getExercises(null);
  initialExercises = result.success ? result.data ?? [] : [];
}

  return <RecordPage initialExercises={initialExercises || []} />;
}
