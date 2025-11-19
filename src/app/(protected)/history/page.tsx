import { format, endOfMonth, startOfMonth } from "date-fns";
import { HistoryPage } from "@/components/features/history";
import { getBodyPartsByDateRange } from "@/lib/actions/history";
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

  // 👍 SSR では「今月の bodyPartsByDate」だけ取得する
  const bodyPartsResult = await getBodyPartsByDateRange(userId, monthRange);

  const hasInitialMonthData =
    !!bodyPartsResult.success && !!bodyPartsResult.data;

  const initialBodyParts =
    bodyPartsResult.success && bodyPartsResult.data ? bodyPartsResult.data : {};

  return (
    <HistoryPage
      initialMonthDate={monthStart.toISOString()}
      initialBodyPartsByDate={initialBodyParts}
      initialSelectedDate={today.toISOString()}
      initialSessionDetails={null} // ← SSR では null 固定
      hasInitialMonthData={hasInitialMonthData}
    />
  );
}
