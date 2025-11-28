import { HomePage } from "@/components/features/home";
import { getBig3MaxWeights } from "@/lib/actions/big3-progress";
import { getBig3TargetValues } from "@/lib/actions/profile";
import { getTotalWorkoutDays } from "@/lib/actions/stats";
import {
  DEFAULT_BIG3_TARGETS,
  type Big3Targets,
  type Big3Weights,
} from "@/lib/big3";
import { getAuthUserId } from "@/lib/auth-session-server";
import { redirect } from "next/navigation";

export default async function Page() {
  const userId = await getAuthUserId();

  // 認証チェック: ユーザーIDがない場合はログイン画面へ
  if (!userId) {
    redirect("/login");
  }

  const [big3Result, targetResult, totalDays] = await Promise.all([
    getBig3MaxWeights(userId),
    getBig3TargetValues(userId),
    getTotalWorkoutDays(userId),
  ]);

  const dbWeights: Big3Weights = {
    benchPress: big3Result.data?.benchPress.maxWeight ?? 0,
    squat: big3Result.data?.squat.maxWeight ?? 0,
    deadlift: big3Result.data?.deadlift.maxWeight ?? 0,
  };

  const targets: Big3Targets =
    targetResult.success && targetResult.data
      ? targetResult.data
      : DEFAULT_BIG3_TARGETS;

  const exerciseIds = {
    benchPress: big3Result.data?.benchPress.exerciseId,
    squat: big3Result.data?.squat.exerciseId,
    deadlift: big3Result.data?.deadlift.exerciseId,
  };

  return (
    <HomePage
      dbWeights={dbWeights}
      targets={targets}
      exerciseIds={exerciseIds}
      totalDays={totalDays}
    />
  );
}
