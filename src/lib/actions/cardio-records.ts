"use server";

import { db } from "../../../db";
import { cardioRecords } from "../../../db/schemas/app";
import { validateExerciseIdAndAuth } from "@/lib/actions/exercises";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";
import type { CardioRecord } from "@/types/workout";

/**
 * 有酸素種目の記録を保存する（既存の記録を削除してから新規保存）
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @param recordsToSave 有酸素記録の配列
 * @returns 保存結果
 */
export async function saveCardioRecords({
  sessionId,
  exerciseId,
  records: recordsToSave,
}: {
  sessionId: string;
  exerciseId: string;
  records: CardioRecord[];
}): Promise<{
  success: boolean;
  error?: string;
  data?: { count: number };
}> {
  try {
    // 種目IDのバリデーションと認証チェック
    const validationResult = await validateExerciseIdAndAuth(exerciseId);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error,
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
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @returns 有酸素記録の配列
 */
export async function getCardioRecords({
  sessionId,
  exerciseId,
}: {
  sessionId: string;
  exerciseId: string;
}): Promise<{
  success: boolean;
  error?: string;
  data?: CardioRecord[];
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    // exerciseIdがモックID（mock-で始まる）の場合は空の配列を返す
    if (exerciseId.startsWith("mock-")) {
      return {
        success: true,
        data: [],
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

    const records: CardioRecord[] = recordsData.map((record) => ({
      id: record.id,
      duration: record.duration,
      distance: record.distance ? parseFloat(record.distance) : null,
      speed: record.speed ? parseFloat(record.speed) : null,
      calories: record.calories ?? null,
      heartRate: record.heartRate ?? null,
      incline: record.incline ? parseFloat(record.incline) : null,
      notes: record.notes ?? null,
      // dateはセッションの日付を使用するため、ここでは現在時刻を設定
      // 実際の使用時はセッションの日付を使用する
      date: new Date(),
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
