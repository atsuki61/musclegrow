import { Metadata } from "next";
import { Suspense } from "react";
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
import Loading from "./loading"; // 既存のloading.tsxをインポートして再利用

export const metadata: Metadata = {
  title: "履歴 | MuscleGrow",
  description: "トレーニングの履歴を確認します",
};

// ==========================================
// 1. メインのページコンポーネント（Shell）
// ==========================================
// ここでは「重い処理」を待たず、すぐにSuspense（ローディング画面）を返します。
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  // 認証チェック（キャッシュ済みなので一瞬で終わる）
  const userId = await getAuthUserId();
  if (!userId) redirect("/login");

  // パラメータの解決
  const resolvedParams = await searchParams;

  return (
    // Suspenseで囲むことで、中身(HistoryMainContent)の準備ができるまで
    // fallback(Loading)を表示しつつ、ヘッダーなどは即座に描画します。
    <Suspense fallback={<Loading />}>
      <HistoryMainContent userId={userId} params={resolvedParams} />
    </Suspense>
  );
}

// ==========================================
// 2. データ取得を行う非同期コンポーネント
// ==========================================
// 以前Pageコンポーネントにあったロジックをここに移動しました。
async function HistoryMainContent({
  userId,
  params,
}: {
  userId: string;
  params: { date?: string; month?: string };
}) {
  const today = new Date();
  const selectedDateStr = params.date;

  // 月の決定
  const monthStr = params.month || format(today, "yyyy-MM");
  const currentMonth = new Date(monthStr);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const monthRange = {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };

  // 並列データ取得
  const [bodyPartsResult, sessionResult] = await Promise.all([
    getBodyPartsByDateRange(userId, monthRange),
    selectedDateStr
      ? getWorkoutSession(userId, selectedDateStr)
      : Promise.resolve({ success: true, data: null }),
  ]);

  // セッション詳細の取得
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
