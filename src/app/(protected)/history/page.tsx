import { Metadata } from "next";
import { Suspense } from "react";
import { HistoryPage } from "@/components/features/history";
import { getAuthUserId } from "@/lib/auth-session-server";
import {
  getBodyPartsByDateRange,
  getSessionDetails,
  getWorkoutSession,
  getExercises,
} from "@/lib/api";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { serializeSessionDetails } from "@/components/features/history/types";
import Loading from "./loading";

export const metadata: Metadata = {
  title: "履歴 | MuscleGrow",
  description: "トレーニングの履歴を確認します",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  // 認証チェックを削除し、IDがなければ空文字として扱う
  const userId = (await getAuthUserId()) ?? "";

  const resolvedParams = await searchParams;

  return (
    <Suspense fallback={<Loading />}>
      <HistoryMainContent userId={userId} params={resolvedParams} />
    </Suspense>
  );
}

async function HistoryMainContent({
  userId,
  params,
}: {
  userId: string;
  params: { date?: string; month?: string };
}) {
  const today = new Date();
  const selectedDateStr = params.date;

  const monthStr = params.month || format(today, "yyyy-MM");
  const currentMonth = new Date(monthStr);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const monthRange = {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };

  // userId が空文字の場合、DBからは空の結果が返り、
  // クライアント側の hooks でローカルストレージのデータを読み込む挙動になる
  const [bodyPartsResult, sessionResult, exercisesResult] = await Promise.all([
    getBodyPartsByDateRange(userId, monthRange),
    selectedDateStr
      ? getWorkoutSession(userId, selectedDateStr)
      : Promise.resolve({ success: true, data: null }),
    getExercises(userId === "" ? null : userId), // getExercisesは null を許容する設計のため
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
      initialExercises={exercisesResult.data ?? []}
    />
  );
}
