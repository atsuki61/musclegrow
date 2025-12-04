import { StatsPage } from "@/components/features/stats";
import { getProfileHistory, getBig3ProgressData } from "@/lib/actions/stats";
import { getExercises } from "@/lib/actions/exercises";
import type { DateRangePreset } from "@/types/stats";
import { identifyBig3Exercises } from "@/lib/utils/stats";
import { getAuthUserId } from "@/lib/auth-session-server";

export default async function Page() {
  const userId = await getAuthUserId();

  // 未ログイン(null)の場合も許容して処理を進める
  // userIdが空文字の場合、各アクションは空データを返却する想定
  const safeUserId = userId ?? "";

  const defaultProfileRange: DateRangePreset = "month";
  const defaultTrainingRange: DateRangePreset = "month";

  const [profileHistoryResult, exercisesResult, big3Result] = await Promise.all(
    [
      getProfileHistory(safeUserId, { preset: defaultProfileRange }),
      // getExercises は内部で "guest" 文字列として処理される分岐があるため safeUserId を渡す
      // または getExercises(userId) として null を渡してもよい（実装による）
      // ここでは安全に空文字を渡しておく
      getExercises(userId),
      getBig3ProgressData(safeUserId, { preset: defaultTrainingRange }),
    ]
  );

  const initialProfileHistory =
    profileHistoryResult.success && profileHistoryResult.data
      ? profileHistoryResult.data
      : [];

  const initialExercises =
    exercisesResult.success && exercisesResult.data ? exercisesResult.data : [];

  const big3Ids = identifyBig3Exercises(
    initialExercises.filter((exercise) => exercise.isBig3)
  );

  const initialExercisesWithData: string[] = [];

  if (big3Result.success && big3Result.data) {
    if (big3Result.data.benchPress.length > 0 && big3Ids.benchPressId) {
      initialExercisesWithData.push(big3Ids.benchPressId);
    }
    if (big3Result.data.squat.length > 0 && big3Ids.squatId) {
      initialExercisesWithData.push(big3Ids.squatId);
    }
    if (big3Result.data.deadlift.length > 0 && big3Ids.deadliftId) {
      initialExercisesWithData.push(big3Ids.deadliftId);
    }
  }

  return (
    <StatsPage
      initialProfileHistory={initialProfileHistory}
      initialProfileDateRange={defaultProfileRange}
      initialTrainingDateRange={defaultTrainingRange}
      initialExercises={initialExercises}
      initialExercisesWithData={initialExercisesWithData}
    />
  );
}
