import { Metadata } from "next";
import { RecordPage } from "@/components/features/record";
import { getAuthUserId } from "@/lib/auth-session-server";
import { getExercises } from "@/lib/api";

export const metadata: Metadata = {
  title: "記録 | MuscleGrow",
  description: "トレーニングを記録します",
};

export default async function Page() {
  // ユーザーIDを取得
  const userId = await getAuthUserId();

  // サーバー側で種目一覧を取得（キャッシュが効くので高速）
  const exercisesResult = await getExercises(userId);
  const initialExercises = exercisesResult.success ? exercisesResult.data : [];

  return <RecordPage initialExercises={initialExercises || []} />;
}
