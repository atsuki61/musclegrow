import { Metadata } from "next";
import { headers } from "next/headers"; // 追加
import { RecordPage } from "@/components/features/record";
import { auth } from "@/lib/auth";
import { getExercises } from "@/lib/api";

export const metadata: Metadata = {
  title: "記録 | MuscleGrow",
  description: "トレーニングを記録します",
};

export default async function Page() {
  // 修正: authを関数としてではなく、APIメソッドとして呼び出す
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // ゲストユーザーも許容する場合は userId = null
  const userId = session?.user?.id || null;

  // サーバー側で種目一覧を取得（キャッシュが効くので高速）
  const exercisesResult = await getExercises(userId);
  const initialExercises = exercisesResult.success ? exercisesResult.data : [];

  return <RecordPage initialExercises={initialExercises || []} />;
}
