import { Metadata } from "next";
import { HistoryPage } from "@/components/features/history";
import { getAuthUserId } from "@/lib/auth-session-server";
import { redirect } from "next/navigation";
import {
  getBodyPartsByDateRange,
  getSessionDetails,
  getWorkoutSession,
} from "@/lib/api";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { serializeSessionDetails } from "@/components/features/history/types";

export const metadata: Metadata = {
  title: "履歴 | MuscleGrow",
  description: "トレーニングの履歴を確認します",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>; // Next.js 15ではsearchParamsはPromise
}) {
  // 修正: キャッシュされた関数を使用。layout.tsxですでに取得済みなら即座に返ります（DBアクセス0回）
  const userId = await getAuthUserId();
  if (!userId) redirect("/login");

  // Next.js 15対応: searchParamsをawait
  const resolvedParams = await searchParams;

  // 日付の決定
  const today = new Date();
  const selectedDateStr = resolvedParams.date;

  // 月の決定
  const monthStr = resolvedParams.month || format(today, "yyyy-MM");
  const currentMonth = new Date(monthStr);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const monthRange = {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };

  const [bodyPartsResult, sessionResult] = await Promise.all([
    getBodyPartsByDateRange(userId, monthRange),
    selectedDateStr
      ? getWorkoutSession(userId, selectedDateStr)
      : Promise.resolve({ success: true, data: null }),
  ]);

  let initialSessionDetails = null;
  if (sessionResult.success && sessionResult.data) {
    const detailsResult = await getSessionDetails(
      userId,
      sessionResult.data.id
    );
    if (detailsResult.success && detailsResult.data) {
      initialSessionDetails = serializeSessionDetails({
        ...detailsResult.data,
        date: new Date(sessionResult.data.date),
        note: sessionResult.data.note,
        durationMinutes: sessionResult.data.durationMinutes,
      });
    }
  }

  return (
    <HistoryPage
      initialMonthDate={currentMonth.toISOString()}
      initialBodyPartsByDate={bodyPartsResult.data ?? {}}
      initialSelectedDate={selectedDateStr ?? null}
      initialSessionDetails={initialSessionDetails}
    />
  );
}
