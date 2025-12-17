import { StatsPage } from "@/components/features/stats";
import { getProfileHistory, getRecordedExerciseIds } from "@/lib/actions/stats";
import { getExercises } from "@/lib/actions/exercises";
import type { DateRangePreset } from "@/types/stats";
import { getAuthUserId } from "@/lib/auth-session-server";

export default async function Page() {
  const userId = await getAuthUserId();
  const safeUserId = userId ?? "";

  const defaultProfileRange: DateRangePreset = "month";
  const defaultTrainingRange: DateRangePreset = "month";

  //Promise.all の中身と受け取り変数を一致させる
  const [profileHistoryResult, exercisesResult, recordedIdsResult] =
    await Promise.all([
      getProfileHistory(safeUserId, { preset: defaultProfileRange }),
      getExercises(userId),
      userId ? getRecordedExerciseIds(userId) : Promise.resolve([]),
    ]);

  const initialProfileHistory =
    profileHistoryResult.success && profileHistoryResult.data
      ? profileHistoryResult.data
      : [];

  const initialExercises =
    exercisesResult.success && exercisesResult.data ? exercisesResult.data : [];

  //recordedIdsResult には正しい配列が入るようになる
  const initialExercisesWithData = Array.from(new Set(recordedIdsResult));

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
