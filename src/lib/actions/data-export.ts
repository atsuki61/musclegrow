"use server";

import { db } from "../../../db";
import {
  sets,
  workoutSessions,
  exercises,
  cardioRecords,
} from "../../../db/schemas/app";
import { eq, desc } from "drizzle-orm";
// 修正: date-fns の format を削除
// import { format } from "date-fns";

/**
 * 全トレーニングデータをCSV形式で取得する
 */
export async function exportAllData(userId: string): Promise<string> {
  // 1. ワークアウト（セット記録）の取得
  const workoutData = await db
    .select({
      date: workoutSessions.date,
      exerciseName: exercises.name,
      bodyPart: exercises.bodyPart,
      weight: sets.weight,
      reps: sets.reps,
      setOrder: sets.setOrder,
      note: workoutSessions.note,
    })
    .from(workoutSessions)
    .innerJoin(sets, eq(workoutSessions.id, sets.sessionId))
    .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSessions.date), sets.setOrder);

  // 2. 有酸素記録の取得
  const cardioData = await db
    .select({
      date: workoutSessions.date,
      exerciseName: exercises.name,
      bodyPart: exercises.bodyPart,
      duration: cardioRecords.duration,
      distance: cardioRecords.distance,
      calories: cardioRecords.calories,
      note: workoutSessions.note,
    })
    .from(workoutSessions)
    .innerJoin(cardioRecords, eq(workoutSessions.id, cardioRecords.sessionId))
    .innerJoin(exercises, eq(cardioRecords.exerciseId, exercises.id))
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSessions.date));

  // 3. CSVヘッダー
  const header = [
    "日付",
    "種目名",
    "部位",
    "種類", // 筋トレ or 有酸素
    "重量(kg)",
    "回数(reps)",
    "セット数",
    "時間(分)",
    "距離(km)",
    "カロリー(kcal)",
    "メモ",
  ].join(",");

  // 4. データ行の生成
  const rows: string[] = [];

  // 筋トレデータの変換
  workoutData.forEach((row) => {
    rows.push(
      [
        row.date,
        `"${row.exerciseName}"`, // カンマを含む可能性があるのでクォート
        row.bodyPart,
        "筋トレ",
        row.weight || "",
        row.reps || "",
        row.setOrder || "",
        "", // 時間
        "", // 距離
        "", // カロリー
        `"${row.note || ""}"`,
      ].join(",")
    );
  });

  // 有酸素データの変換
  cardioData.forEach((row) => {
    rows.push(
      [
        row.date,
        `"${row.exerciseName}"`,
        row.bodyPart,
        "有酸素",
        "", // 重量
        "", // 回数
        "", // セット数
        row.duration || "",
        row.distance || "",
        row.calories || "",
        `"${row.note || ""}"`,
      ].join(",")
    );
  });

  // 日付順にソートし直す（筋トレと有酸素を混ぜて日付順に）
  rows.sort((a, b) => {
    const dateA = a.split(",")[0];
    const dateB = b.split(",")[0];
    return dateB.localeCompare(dateA); // 降順（新しい順）
  });

  return [header, ...rows].join("\n");
}
