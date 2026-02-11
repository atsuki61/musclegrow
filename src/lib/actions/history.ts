"use server";

import { db } from "../../../db";
import {
  sets,
  cardioRecords,
  exercises,
  workoutSessions,
} from "../../../db/schemas/app";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
import type { SetRecord, CardioRecord } from "@/types/workout";
import type { BodyPart } from "@/types/workout";

/**
 * NOTE: unstable_cacheを使用中
 * 将来的にNext.jsで削除された場合は、React cacheに移行する予定
 * 移行方法: import { cache } from 'react' でラップ
 */
import { unstable_cache } from "next/cache";

/**
 * 月ごとの部位一覧（ユーザー別キャッシュ）
 */
export const cachedGetBodyPartsByDateRange = unstable_cache(
  async (userId: string, range: { startDate: string; endDate: string }) => {
    return await getBodyPartsByDateRange(userId, range);
  },
  ["history-bodyparts"],
  {
    tags: ["history-bodyparts"],
  }
);

/**
 * セッション詳細（ユーザー別キャッシュ）
 */
export const cachedGetSessionDetails = unstable_cache(
  async (userId: string, sessionId: string) => {
    return await getSessionDetails(userId, sessionId);
  },
  ["history-session"],
  {
    tags: ["history-session"],
  }
);

/**
 * テーブルが存在しない場合のエラーハンドリングを行う共通関数
 */
async function handleTableNotExistsError<T>(
  queryFn: () => Promise<T>,
  defaultValue: T,
  tableName: string
): Promise<T> {
  try {
    return await queryFn();
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("does not exist")) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`${tableName}テーブルが存在しません`);
      }
      return defaultValue;
    }
    throw error;
  }
}

/**
 * セッションIDでそのセッションの全種目とセット記録を取得する
 * 日付、メモ、時間などのメタデータも返す
 * @param userId ユーザーID
 * @param sessionId セッションID
 */
export async function getSessionDetails(
  userId: string,
  sessionId: string
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    id: string;
    date: string;
    durationMinutes: number | null;
    note: string | null;
    workoutExercises: Array<{
      exerciseId: string;
      sets: SetRecord[];
    }>;
    cardioExercises: Array<{
      exerciseId: string;
      records: CardioRecord[];
    }>;
  };
}> {
  try {
    if (!userId || userId === "") {
      return {
        success: false,
        error: "ユーザーIDが無効です",
      };
    }

    const [session] = await db
      .select({
        id: workoutSessions.id,
        userId: workoutSessions.userId,
        date: workoutSessions.date,
        durationMinutes: workoutSessions.durationMinutes,
        note: workoutSessions.note,
      })
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return { success: false, error: "セッションが見つかりません" };
    }
    if (session.userId !== userId) {
      return { success: false, error: "アクセス権限がありません" };
    }

    // セット記録（無酸素）と有酸素記録（cardio）を並列取得
    const [setsData, cardioData] = await Promise.all([
      db
        .select({
          id: sets.id,
          exerciseId: sets.exerciseId,
          setOrder: sets.setOrder,
          weight: sets.weight,
          reps: sets.reps,
          rpe: sets.rpe,
          isWarmup: sets.isWarmup,
          restSeconds: sets.restSeconds,
          notes: sets.notes,
          failure: sets.failure,
          createdAt: sets.createdAt,
        })
        .from(sets)
        .where(eq(sets.sessionId, sessionId))
        .orderBy(sets.createdAt, sets.setOrder),

      handleTableNotExistsError(
        () =>
          db
            .select({
              id: cardioRecords.id,
              exerciseId: cardioRecords.exerciseId,
              duration: cardioRecords.duration,
              distance: cardioRecords.distance,
              speed: cardioRecords.speed,
              calories: cardioRecords.calories,
              heartRate: cardioRecords.heartRate,
              incline: cardioRecords.incline,
              notes: cardioRecords.notes,
              createdAt: cardioRecords.createdAt,
            })
            .from(cardioRecords)
            .where(eq(cardioRecords.sessionId, sessionId)),
        [],
        "cardio_records"
      ),
    ]);

    // 整形処理: セット記録
    const workoutExercisesMap = new Map<string, SetRecord[]>();
    const workoutExerciseFirstCreatedAt = new Map<string, Date>();

    setsData.forEach((row) => {
      const list = workoutExercisesMap.get(row.exerciseId) || [];

      // 各種目の最初のセットの作成日時を記録
      if (!workoutExerciseFirstCreatedAt.has(row.exerciseId)) {
        workoutExerciseFirstCreatedAt.set(
          row.exerciseId,
          new Date(row.createdAt)
        );
      }

      list.push({
        id: row.id,
        setOrder: row.setOrder,
        weight: row.weight ? Number(row.weight) : undefined,
        reps: row.reps,
        rpe: row.rpe ? Number(row.rpe) : null,
        isWarmup: row.isWarmup ?? false,
        restSeconds: row.restSeconds ?? null,
        notes: row.notes ?? null,
        failure: row.failure ?? false,
        duration: null,
      });
      workoutExercisesMap.set(row.exerciseId, list);
    });

    // 整形処理: 有酸素記録
    const cardioExercisesMap = new Map<string, CardioRecord[]>();
    const cardioExerciseFirstCreatedAt = new Map<string, Date>();

    cardioData.forEach((row) => {
      const list = cardioExercisesMap.get(row.exerciseId) || [];

      // 各種目の最初の記録の作成日時を記録
      if (!cardioExerciseFirstCreatedAt.has(row.exerciseId)) {
        cardioExerciseFirstCreatedAt.set(
          row.exerciseId,
          new Date(row.createdAt)
        );
      }

      list.push({
        id: row.id,
        duration: Number(row.duration),
        distance: row.distance ? Number(row.distance) : null,
        speed: row.speed ? Number(row.speed) : null,
        calories: row.calories ?? null,
        heartRate: row.heartRate ?? null,
        incline: row.incline ? Number(row.incline) : null,
        notes: row.notes ?? null,
        date: new Date(row.createdAt),
      });
      cardioExercisesMap.set(row.exerciseId, list);
    });

    return {
      success: true,
      data: {
        id: session.id,
        date: session.date,
        durationMinutes: session.durationMinutes,
        note: session.note,
        workoutExercises: Array.from(workoutExercisesMap.entries())
          .map(([exerciseId, sets]) => ({ exerciseId, sets }))
          .sort((a, b) => {
            const timeA =
              workoutExerciseFirstCreatedAt.get(a.exerciseId)?.getTime() ?? 0;
            const timeB =
              workoutExerciseFirstCreatedAt.get(b.exerciseId)?.getTime() ?? 0;
            return timeA - timeB;
          }),
        cardioExercises: Array.from(cardioExercisesMap.entries())
          .map(([exerciseId, records]) => ({ exerciseId, records }))
          .sort((a, b) => {
            const timeA =
              cardioExerciseFirstCreatedAt.get(a.exerciseId)?.getTime() ?? 0;
            const timeB =
              cardioExerciseFirstCreatedAt.get(b.exerciseId)?.getTime() ?? 0;
            return timeA - timeB;
          }),
      },
    };
  } catch (error: unknown) {
    console.error("セッション詳細取得エラー:", error);
    return { success: false, error: "セッション詳細の取得に失敗しました" };
  }
}

/**
 * 日付範囲で日付ごとの部位一覧を取得する（カレンダー色付け用）
 * @param userId ユーザーID（空文字の場合は空の結果を返す）
 * @param startDate 開始日（YYYY-MM-DD形式）
 * @param endDate 終了日（YYYY-MM-DD形式）
 */
export async function getBodyPartsByDateRange(
  userId: string,
  {
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: Record<string, BodyPart[]>;
}> {
  try {
    // ゲストモード（空文字）の場合は空の結果を返す
    if (!userId || userId === "") {
      return {
        success: true,
        data: {},
      };
    }

    const [strengthRows, cardioRows] = await Promise.all([
      db
        .select({
          date: workoutSessions.date,
          bodyPart: exercises.bodyPart,
        })
        .from(workoutSessions)
        .innerJoin(sets, eq(sets.sessionId, workoutSessions.id))
        .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
        .where(
          and(
            eq(workoutSessions.userId, userId),
            gte(workoutSessions.date, startDate),
            lte(workoutSessions.date, endDate)
          )
        )
        .groupBy(workoutSessions.date, exercises.bodyPart),

      handleTableNotExistsError(
        () =>
          db
            .select({
              date: workoutSessions.date,
              bodyPart: exercises.bodyPart,
            })
            .from(workoutSessions)
            .innerJoin(
              cardioRecords,
              eq(cardioRecords.sessionId, workoutSessions.id)
            )
            .innerJoin(exercises, eq(cardioRecords.exerciseId, exercises.id))
            .where(
              and(
                eq(workoutSessions.userId, userId),
                gte(workoutSessions.date, startDate),
                lte(workoutSessions.date, endDate)
              )
            )
            .groupBy(workoutSessions.date, exercises.bodyPart),
        [],
        "cardio_records"
      ),
    ]);

    const bodyPartsByDate: Record<string, Set<BodyPart>> = {};

    const appendRow = (row: { date: string; bodyPart: string | null }) => {
      if (!row.bodyPart) return;
      if (!bodyPartsByDate[row.date]) {
        bodyPartsByDate[row.date] = new Set();
      }
      bodyPartsByDate[row.date].add(row.bodyPart as BodyPart);
    };

    strengthRows.forEach(appendRow);
    cardioRows.forEach(appendRow);

    const result: Record<string, BodyPart[]> = {};
    Object.keys(bodyPartsByDate).forEach((date) => {
      result[date] = Array.from(bodyPartsByDate[date]);
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    console.error("部位一覧取得エラー:", error);
    return {
      success: false,
      error: "部位一覧の取得に失敗しました",
    };
  }
}



import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

const getExerciseHistorySchema = z.object({
  exerciseId: z.string(),
  limit: z.number().default(10),
});

/**
 * 指定種目のトレーニング履歴を取得する
 */
export const getExerciseHistory = authActionClient
  .schema(getExerciseHistorySchema)
  .action(async ({ parsedInput: { exerciseId, limit }, ctx: { userId } }) => {
    if (exerciseId.startsWith("mock-")) {
      return [];
    }

    // 1. 最新の日付を取得する（指定件数分）
    const datesResult = await db
      .selectDistinct({
        date: workoutSessions.date,
      })
      .from(workoutSessions)
      .innerJoin(sets, eq(sets.sessionId, workoutSessions.id))
      .where(
        and(eq(workoutSessions.userId, userId), eq(sets.exerciseId, exerciseId))
      )
      .orderBy(desc(workoutSessions.date))
      .limit(limit);

    if (datesResult.length === 0) {
      return [];
    }

    const targetDates = datesResult.map((d) => d.date);

    // 2. 取得した日付のデータを取得する
    const historyData = await db
      .select({
        date: workoutSessions.date,
        weight: sets.weight,
        reps: sets.reps,
        setOrder: sets.setOrder,
      })
      .from(sets)
      .innerJoin(workoutSessions, eq(sets.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(sets.exerciseId, exerciseId),
          inArray(workoutSessions.date, targetDates)
        )
      )
      .orderBy(desc(workoutSessions.date), sets.setOrder);

    // 日付ごとにデータをまとめる
    const groupedHistory: Record<string, typeof historyData> = {};

    historyData.forEach((record) => {
      const dateStr = record.date;
      if (!groupedHistory[dateStr]) {
        groupedHistory[dateStr] = [];
      }
      groupedHistory[dateStr].push(record);
    });

    // オブジェクトを配列に変換して返す
    const result = Object.entries(groupedHistory).map(([date, sets]) => ({
      date: new Date(date),
      sets: sets.map((s) => ({
        weight: s.weight ? parseFloat(s.weight) : null,
        reps: s.reps,
        duration: null,
        setOrder: s.setOrder,
      })),
    }));

    // 日付順にソート（新しい順）
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  });
