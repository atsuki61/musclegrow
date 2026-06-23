"use server";

import { db } from "../../../db";
import { sets, workoutSessions } from "../../../db/schemas/app";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import {
  getWeekRange,
  buildWeeklySummary,
  emptyWeeklySummary,
  type DailyVolume,
  type WeeklySummary,
} from "@/lib/utils/weekly-summary";

// 有効セット条件（DB/ゲストで同一）: NOT isWarmup AND weight>0 AND reps>0
const validSet = sql`${sets.isWarmup} = false AND ${sets.weight} > 0 AND ${sets.reps} > 0`;
const volumeExpr = sql<number>`COALESCE(SUM((${sets.weight}::numeric) * ${sets.reps}), 0)::float`;

/**
 * 今週（月〜日, JST）の週間サマリーをDBから集計する
 */
export async function getWeeklySummary(
  userId: string,
  now: Date = new Date()
): Promise<WeeklySummary> {
  const range = getWeekRange(now);

  try {
    // 今週: 日別集計
    const weekRows = await db
      .select({
        date: workoutSessions.date,
        volume: volumeExpr,
        setCount: sql<number>`COUNT(*)::int`,
      })
      .from(sets)
      .innerJoin(workoutSessions, eq(sets.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          validSet,
          gte(workoutSessions.date, range.weekStart),
          lte(workoutSessions.date, range.weekEnd)
        )
      )
      .groupBy(workoutSessions.date);

    // 先週: 合計のみ
    const prevRows = await db
      .select({ volume: volumeExpr })
      .from(sets)
      .innerJoin(workoutSessions, eq(sets.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          validSet,
          gte(workoutSessions.date, range.prevWeekStart),
          lte(workoutSessions.date, range.prevWeekEnd)
        )
      );

    const weekDays: DailyVolume[] = weekRows.map((r) => ({
      date: r.date,
      volume: Number(r.volume) || 0,
      setCount: Number(r.setCount) || 0,
    }));
    const prevWeekVolume = Number(prevRows[0]?.volume) || 0;

    return buildWeeklySummary(weekDays, prevWeekVolume, range);
  } catch (error) {
    console.error("週間サマリーの取得に失敗しました:", error);
    return emptyWeeklySummary(range);
  }
}
