"use server";

import { revalidateTag } from "next/cache"; // Next.jsのキャッシュを無効化する関数
import { db } from "../../../db"; // データベース接続オブジェクト
import { workoutSessions, sets, cardioRecords } from "../../../db/schemas/app"; // テーブルスキーマ定義
import { eq, and, sql } from "drizzle-orm"; // Drizzle ORMのクエリビルダー関数
// eq: 等価比較、and: AND条件、sql: 生SQLクエリ実行

/**
 * ワークアウトセッションを保存または更新する
 * @param userId ユーザーID
 * @param sessionData セッションデータ
 */
export async function saveWorkoutSession(
  userId: string,
  {
    date,
    note,
    durationMinutes,
  }: {
    date: string;
    note?: string | null;
    durationMinutes?: number | null;
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string; date: string };
}> {
  try {
    // 1. 「その日」のセッションが既に存在するかチェック
    // Drizzle ORMのクエリビルダーを使用してデータベースを検索
    const [existingSession] = await db
      .select() // 既存セッションの全カラムを取得
      .from(workoutSessions) // workoutSessionsテーブルから
      .where(
        // WHERE条件: userIdが一致 AND dateが一致
        and(eq(workoutSessions.userId, userId), eq(workoutSessions.date, date))
      )
      .limit(1); // 最大1件のみ取得（配列の最初の要素を取得）

    let sessionId: string;

    if (existingSession) {
      // 2a. 既にセッションが存在する場合は更新
      // メモやトレーニング時間が変更された可能性があるため
      await db
        .update(workoutSessions) // UPDATE文を実行
        .set({
          // ?? は null合体演算子: 左側がnull/undefinedなら右側の値を使用
          note: note ?? existingSession.note,
          durationMinutes: durationMinutes ?? existingSession.durationMinutes,
          updatedAt: new Date(), // 更新日時を現在時刻に設定
        })
        .where(eq(workoutSessions.id, existingSession.id)); // 該当するIDのレコードを更新
      sessionId = existingSession.id;
    } else {
      // 2b. セッションが存在しない場合は新規作成
      const [newSession] = await db
        .insert(workoutSessions) // INSERT文を実行
        .values({
          userId,
          date,
          note: note ?? null, // null合体演算子でnullを設定
          durationMinutes: durationMinutes ?? null,
        })
        .returning({ id: workoutSessions.id }); // 作成したレコードのIDを返す
      sessionId = newSession.id;

      // 新規作成時のみ、総トレーニング日数のキャッシュを無効化
      // これにより次回取得時に最新の日数が反映される
      revalidateTag(`stats:total-days:${userId}`);
    }

    // セッション情報のキャッシュを無効化（次回取得時に最新データを取得）
    revalidateTag(`workout-session:${userId}:${date}`);

    return {
      success: true,
      data: { id: sessionId, date },
    };
  } catch (error: unknown) {
    // エラーハンドリング: unknown型のエラーを安全に処理
    // error instanceof Error でError型かチェックし、メッセージを取得
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    console.error("セッション保存エラー:", errorMessage);
    return {
      success: false,
      error: "セッションの保存に失敗しました",
    };
  }
}

/**
 * 指定日付のワークアウトセッションを取得する
 * @param userId ユーザーID
 * @param date 日付 (YYYY-MM-DD)
 */
export async function getWorkoutSession(
  userId: string,
  date: string
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    id: string;
    date: string;
    note?: string | null;
    durationMinutes?: number | null;
  };
}> {
  try {
    // データベースから指定日付のセッションを取得
    // saveWorkoutSessionと同じクエリパターン（詳細は上記参照）
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(
        and(eq(workoutSessions.userId, userId), eq(workoutSessions.date, date))
      )
      .limit(1);

    // セッションが見つからない場合はundefinedを返す（エラーではない）
    if (!session) {
      return { success: true, data: undefined };
    }

    return {
      success: true,
      data: {
        id: session.id,
        date: session.date,
        note: session.note,
        durationMinutes: session.durationMinutes,
      },
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    console.error("セッション取得エラー:", errorMessage);
    return {
      success: false,
      error: "セッションの取得に失敗しました",
    };
  }
}

// データベースクエリ結果の型定義
// db.execute()で実行したSQLクエリの結果を型安全に扱うためのインターフェース
interface SqlResult {
  rows: Record<string, unknown>[]; // 各行がキー（カラム名）と値のオブジェクトの配列
}

/**
 * ユーザーの全期間の種目別最終トレーニング日を取得する
 * @param userId ユーザーID
 * @returns Record<exerciseId, dateString(YYYY-MM-DD)>
 */
export async function getLastTrainedDatesFromDB(userId: string): Promise<{
  success: boolean;
  data?: Record<string, string>;
  error?: string;
}> {
  try {
    // SQLクエリ1: 筋力トレーニング（sets）の種目別最終トレーニング日を取得
    // - JOIN: workoutSessionsテーブルとsetsテーブルを結合
    // - MAX(): 各種目（exerciseId）ごとに最新の日付を取得
    // - GROUP BY: 種目ごとにグループ化
    const setsResult = (await db.execute(sql`
      SELECT
        ${sets.exerciseId} as exercise_id,  -- 種目ID
        MAX(${workoutSessions.date}) as last_date  -- その種目の最新トレーニング日
      FROM ${workoutSessions}
      JOIN ${sets} ON ${sets.sessionId} = ${workoutSessions.id}  -- セッションIDで結合
      WHERE ${workoutSessions.userId} = ${userId}  -- 該当ユーザーのデータのみ
      GROUP BY ${sets.exerciseId}  -- 種目ごとにグループ化
    `)) as unknown as SqlResult; // 型アサーション: SQL実行結果をSqlResult型に変換

    // SQLクエリ2: 有酸素トレーニング（cardioRecords）の種目別最終トレーニング日を取得
    // setsResultと同じ構造のクエリ（詳細は上記参照）
    const cardioResult = (await db.execute(sql`
      SELECT
        ${cardioRecords.exerciseId} as exercise_id,
        MAX(${workoutSessions.date}) as last_date
      FROM ${workoutSessions}
      JOIN ${cardioRecords} ON ${cardioRecords.sessionId} = ${workoutSessions.id}
      WHERE ${workoutSessions.userId} = ${userId}
      GROUP BY ${cardioRecords.exerciseId}
    `)) as unknown as SqlResult;

    // 種目IDをキー、最終トレーニング日を値とするマップ（連想配列）
    const map: Record<string, string> = {};

    // クエリ結果の各行を処理する関数
    // 型ガードで安全にデータを取得し、マップに格納
    const processRow = (row: Record<string, unknown>) => {
      // 型ガード: exercise_idとlast_dateが文字列型か確認
      if (
        typeof row.exercise_id === "string" &&
        typeof row.last_date === "string"
      ) {
        const exerciseId = row.exercise_id;
        const lastDate = row.last_date;

        // マップに存在しない、またはより新しい日付の場合に更新
        // 文字列比較で日付の大小を判定（YYYY-MM-DD形式なので可能）
        if (!map[exerciseId] || lastDate > map[exerciseId]) {
          map[exerciseId] = lastDate;
        }
      }
    };

    // 筋力トレーニングの結果を処理
    if (Array.isArray(setsResult.rows)) {
      setsResult.rows.forEach(processRow);
    }

    // 有酸素トレーニングの結果を処理（同じ種目があればより新しい日付で上書き）
    if (Array.isArray(cardioResult.rows)) {
      cardioResult.rows.forEach(processRow);
    }

    return { success: true, data: map };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    console.error("最終トレーニング日取得エラー:", errorMessage);
    return { success: false, error: "データの取得に失敗しました" };
  }
}
