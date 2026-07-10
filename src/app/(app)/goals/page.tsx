import { GoalsPage } from "@/components/features/goals";
import type { Big3TargetFormValues } from "@/components/features/goals/goals-page";
import { getProfile } from "@/lib/actions/profile";
import { getAuthSession } from "@/lib/auth-session-server";

export default async function Page() {
  const session = await getAuthSession();
  const userId = session?.user?.id ?? null;

  let initialTargets: Big3TargetFormValues | null = null;

  if (userId) {
    const result = await getProfile();
    if (result.success && result.data) {
      initialTargets = {
        benchPress: result.data.big3TargetBenchPress?.toString() ?? "",
        squat: result.data.big3TargetSquat?.toString() ?? "",
        deadlift: result.data.big3TargetDeadlift?.toString() ?? "",
      };
    }
  }

  return <GoalsPage initialTargets={initialTargets} userId={userId} />;
}
