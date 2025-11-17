import { format, endOfMonth, startOfMonth } from "date-fns";
import { HistoryPage } from "@/components/features/history";
import { getBodyPartsByDateRange, getSessionDetails } from "@/lib/actions/history";
import { getWorkoutSession } from "@/lib/actions/workout-sessions";
import { serializeSessionDetails } from "@/components/features/history/types";

export default async function Page() {
  const today = new Date();
  const monthStart = startOfMonth(today);

  const monthRange = {
    startDate: format(monthStart, "yyyy-MM-dd"),
    endDate: format(endOfMonth(today), "yyyy-MM-dd"),
  };

  const [bodyPartsResult, sessionResult] = await Promise.all([
    getBodyPartsByDateRange(monthRange),
    getWorkoutSession(format(today, "yyyy-MM-dd")),
  ]);

  let initialSessionDetails = null;

  if (sessionResult.success && sessionResult.data) {
    const detailsResult = await getSessionDetails(sessionResult.data.id);
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

