import { HomePage } from "@/components/features/home";
import { getBig3MaxWeights } from "@/lib/actions/big3-progress";
import { getBig3TargetValues } from "@/lib/actions/profile";
import { getTotalWorkoutDays } from "@/lib/actions/stats";
import { getAuthSession } from "@/lib/auth-session-server";
import { identifyBig3Exercises } from "@/lib/utils/stats";
import { getExercises } from "@/lib/api";

export default async function Home() {
  const session = await getAuthSession();
  const userId = session?.user?.id ?? null;

  // 並列でデータを取得
  const [big3Result, targetsResult, totalDays, exercisesResult] =
    await Promise.all([
      getBig3MaxWeights(userId),
      getBig3TargetValues(userId),
      userId ? getTotalWorkoutDays(userId) : Promise.resolve(0),
      getExercises(userId),
    ]);

  // Big3種目のIDを特定
  const exercises =
    exercisesResult.success && exercisesResult.data ? exercisesResult.data : [];
  const big3Ids = identifyBig3Exercises(exercises.filter((ex) => ex.isBig3));

  const dbWeights = {
    benchPress: big3Result.data?.benchPress.maxWeight ?? 0,
    squat: big3Result.data?.squat.maxWeight ?? 0,
    deadlift: big3Result.data?.deadlift.maxWeight ?? 0,
  };

  const targets = targetsResult.data ?? {
    benchPress: 100,
    squat: 120,
    deadlift: 140,
  };

  const exerciseIds = {
    benchPress: big3Ids.benchPressId,
    squat: big3Ids.squatId,
    deadlift: big3Ids.deadliftId,
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
