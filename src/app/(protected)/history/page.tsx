import { format, endOfMonth, startOfMonth } from "date-fns";
import { HistoryPage } from "@/components/features/history";
import { getBodyPartsByDateRange, getSessionDetails } from "@/lib/actions/history";
import { getWorkoutSession } from "@/lib/actions/workout-sessions";
import { serializeSessionDetails } from "@/components/features/history/types";
import { getAuthUserId } from "@/lib/auth-session-server";

export default async function Page() {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const today = new Date();
  const monthStart = startOfMonth(today);

  const monthRange = {
    startDate: format(monthStart, "yyyy-MM-dd"),
    endDate: format(endOfMonth(today), "yyyy-MM-dd"),
  };

  const [bodyPartsResult, sessionResult] = await Promise.all([
    getBodyPartsByDateRange(userId, monthRange),
    getWorkoutSession(userId, format(today, "yyyy-MM-dd")),
  ]);

  let initialSessionDetails = null;

  if (sessionResult.success && sessionResult.data) {
    const detailsResult = await getSessionDetails(userId, sessionResult.data.id);
    if (detailsResult.success && detailsResult.data) {
      initialSessionDetails = serializeSessionDetails({
        ...detailsResult.data,
        date: today,
        durationMinutes: sessionResult.data.durationMinutes ?? null,
        note: sessionResult.data.note ?? null,
      });
    }
  }

  const hasInitialMonthData =
    !!bodyPartsResult.success && !!bodyPartsResult.data;
  const initialBodyParts =
    bodyPartsResult.success && bodyPartsResult.data
      ? bodyPartsResult.data
      : {};

  return (
    <HistoryPage
      initialMonthDate={monthStart.toISOString()}
      initialBodyPartsByDate={initialBodyParts}
      initialSelectedDate={today.toISOString()}
      initialSessionDetails={initialSessionDetails}
      hasInitialMonthData={hasInitialMonthData}
    />
  );
}

