import { Metadata } from "next";
import { headers } from "next/headers"; // 追加
import { HistoryPage } from "@/components/features/history";
import { auth } from "@/lib/auth";
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
  searchParams: { date?: string; month?: string };
}) {
  // 修正: authを関数としてではなく、APIメソッドとして呼び出す
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // 日付の決定（URLパラメータ or 今日）
  const today = new Date();
  const selectedDateStr = await searchParams.date;
  // 修正: 未使用の変数を削除
  // const selectedDate = selectedDateStr ? new Date(selectedDateStr) : today;

  // 月の決定
  const monthStr = searchParams.month || format(today, "yyyy-MM");
  const currentMonth = new Date(monthStr);

  // 並列データ取得 (Promise.all で待機時間を短縮)
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const monthRange = {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };

  // 1. カレンダーの色分けデータ
  // 2. 選択された日の詳細データ（もしあれば）
  const [bodyPartsResult, sessionResult] = await Promise.all([
    getBodyPartsByDateRange(userId, monthRange),
    // 選択された日付のセッションIDを取得
    selectedDateStr
      ? getWorkoutSession(userId, selectedDateStr)
      : Promise.resolve({ success: true, data: null }),
  ]);

  // セッション詳細の取得（セッションIDがある場合のみ）
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
