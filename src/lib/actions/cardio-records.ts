"use server";

import { db } from "../../../db";
import { cardioRecords, workoutSessions } from "../../../db/schemas/app";
import { validateExerciseIdAndAuth } from "@/lib/actions/exercises";
import { eq, and, lt, desc } from "drizzle-orm";
import type { CardioRecord } from "@/types/workout";

/**
 * 有酸素種目の記録を保存する（既存の記録を削除してから新規保存）
 * @param userId ユーザーID
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @param recordsToSave 有酸素記録の配列
 * @returns 保存結果
 */
export async function saveCardioRecords(
  userId: string,
  {
    sessionId,
    exerciseId,
    records: recordsToSave,
  }: {
    sessionId: string;
    exerciseId: string;
    records: CardioRecord[];
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: { count: number };
}> {
  try {
    if (!userId || userId === "") {
      return {
        success: false,
        error: "ユーザーIDが無効です",
      };
    }

    // 種目IDのバリデーションと認証チェック
    const validationResult = await validateExerciseIdAndAuth(
      userId,
      exerciseId
    );
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error,
      };
    }

    // セッションがそのユーザーのものか確認
    const [session] = await db
      .select({ userId: workoutSessions.userId })
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return {
        success: false,
        error: "セッションが見つかりません",
      };
    }

    if (session.userId !== userId) {
      return {
        success: false,
        error: "このセッションにアクセスする権限がありません",
      };
    }

    // 有効な記録のみをフィルタリング（時間が0より大きい、または距離・カロリー・心拍数・傾斜のいずれかが0より大きい）
    const validRecords = recordsToSave.filter(
      (record) =>
        record.duration > 0 ||
        (record.distance ?? 0) > 0 ||
        (record.calories ?? 0) > 0 ||
        (record.heartRate ?? 0) > 0 ||
        (record.incline ?? 0) > 0
    );

    // 有効な記録がない場合は、既存の記録を削除して終了
    if (validRecords.length === 0) {
      await db
        .delete(cardioRecords)
        .where(
          and(
            eq(cardioRecords.sessionId, sessionId),
            eq(cardioRecords.exerciseId, exerciseId)
          )
        );
      return {
        success: true,
        data: { count: 0 },
      };
    }

    // トランザクションで既存の記録を削除してから新規保存
    await db.transaction(async (tx) => {
      // 既存の記録を削除
      await tx
        .delete(cardioRecords)
        .where(
          and(
            eq(cardioRecords.sessionId, sessionId),
            eq(cardioRecords.exerciseId, exerciseId)
          )
        );

      // 新しい記録を保存
      // numeric型のフィールド（distance, speed, incline）は文字列として扱う必要がある
      const recordsToInsert = validRecords.map((record) => ({
        sessionId,
        exerciseId,
        duration: record.duration,
        distance:
          record.distance !== undefined && record.distance !== null
            ? record.distance.toString()
            : null,
        speed:
          record.speed !== undefined && record.speed !== null
            ? record.speed.toString()
            : null,
        calories: record.calories ?? null,
        heartRate: record.heartRate ?? null,
        incline:
          record.incline !== undefined && record.incline !== null
            ? record.incline.toString()
            : null,
        notes: record.notes ?? null,
      }));

      await tx.insert(cardioRecords).values(recordsToInsert);
    });

    return {
      success: true,
      data: { count: validRecords.length },
    };
  } catch (error: unknown) {
    console.error("有酸素記録保存エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "有酸素記録の保存に失敗しました",
    };
  }
}

/**
 * 指定セッション・種目の有酸素記録を取得する
 * @param userId ユーザーID
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @returns 有酸素記録の配列
 */
export async function getCardioRecords(
  userId: string,
  {
    sessionId,
    exerciseId,
  }: {
    sessionId: string;
    exerciseId: string;
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: CardioRecord[];
}> {
  try {
    if (!userId || userId === "") {
      return {
        success: false,
        error: "ユーザーIDが無効です",
      };
    }

    // exerciseIdがモックID（mock-で始まる）の場合は空の配列を返す
    if (exerciseId.startsWith("mock-")) {
      return {
        success: true,
        data: [],
      };
    }

    // セッションがそのユーザーのものか確認（日付も取得）
    const [session] = await db
      .select({
        userId: workoutSessions.userId,
        date: workoutSessions.date,
      })
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return {
        success: false,
        error: "セッションが見つかりません",
      };
    }

    if (session.userId !== userId) {
      return {
        success: false,
        error: "このセッションにアクセスする権限がありません",
      };
    }

    const recordsData = await db
      .select()
      .from(cardioRecords)
      .where(
        and(
          eq(cardioRecords.sessionId, sessionId),
          eq(cardioRecords.exerciseId, exerciseId)
        )
      )
      .orderBy(cardioRecords.createdAt);

    // セッションの日付を使用
    const sessionDate = new Date(session.date);

    const records: CardioRecord[] = recordsData.map((record) => ({
      id: record.id,
      duration: record.duration,
      distance: record.distance ? parseFloat(record.distance) : null,
      speed: record.speed ? parseFloat(record.speed) : null,
      calories: record.calories ?? null,
      heartRate: record.heartRate ?? null,
      incline: record.incline ? parseFloat(record.incline) : null,
      notes: record.notes ?? null,
      date: sessionDate,
    }));

    return {
      success: true,
      data: records,
    };
  } catch (error: unknown) {
    console.error("有酸素記録取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "有酸素記録の取得に失敗しました",
    };
  }
}

/**
 * 指定された種目の最新の有酸素記録を取得する
 * @param userId ユーザーID
 * @param exerciseId 種目ID
 * @param beforeDate この日付より前の記録を取得（オプション）
 */
export async function getLatestCardioRecord(
  userId: string,
  exerciseId: string,
  beforeDate?: Date
): Promise<{
  success: boolean;
  data?: { records: CardioRecord[]; date: Date } | null;
  error?: string;
}> {
  try {
    if (!userId || userId === "") {
      return {
        success: false,
        error: "ユーザーIDが無効です",
      };
    }

    let dateCondition = undefined;
    if (beforeDate) {
      const dateStr = beforeDate.toISOString().split("T")[0];
      dateCondition = lt(workoutSessions.date, dateStr);
    }

    const [latestSession] = await db
      .select({
        id: workoutSessions.id,
        date: workoutSessions.date,
      })
      .from(workoutSessions)
      .innerJoin(cardioRecords, eq(cardioRecords.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(cardioRecords.exerciseId, exerciseId),
          dateCondition
        )
      )
      .orderBy(desc(workoutSessions.date))
      .limit(1);

    if (!latestSession) {
      return { success: true, data: null };
    }
    //記録データを取得
    const recordsData = await db
      .select()
      .from(cardioRecords)
      .where(
        and(
          eq(cardioRecords.sessionId, latestSession.id),
          eq(cardioRecords.exerciseId, exerciseId)
        )
      )
      .orderBy(cardioRecords.createdAt);

    //セッションの日付を取得
    const sessionDate = new Date(latestSession.date);

    //記録をCardioRecord型にマッピング
    const records: CardioRecord[] = recordsData.map((record) => ({
      id: record.id,
      duration: record.duration,
      distance: record.distance ? parseFloat(record.distance) : null,
      speed: record.speed ? parseFloat(record.speed) : null,
      calories: record.calories ?? null,
      heartRate: record.heartRate ?? null,
      incline: record.incline ? parseFloat(record.incline) : null,
      notes: record.notes ?? null,
      date: sessionDate,
    }));

    return {
      success: true,
      data: {
        records,
        date: sessionDate,
      },
    };
  } catch (error: unknown) {
    console.error("最新有酸素記録取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "最新有酸素記録の取得に失敗しました",
    };
  }
}
