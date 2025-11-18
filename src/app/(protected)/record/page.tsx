import { Suspense } from "react";
import { RecordPage } from "@/components/features/record";
import { getExercises } from "@/lib/actions/exercises";
import { getAuthUserId } from "@/lib/auth-session-server";

export default async function Page() {
  const userId = await getAuthUserId();
  const exercisesResult = await getExercises(userId);
  const initialExercises = exercisesResult.success && exercisesResult.data ? exercisesResult.data : [];

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 text-center">
          読み込み中...
        </div>
      }
    >
      <RecordPage initialExercises={initialExercises} />
    </Suspense>
  );
}
