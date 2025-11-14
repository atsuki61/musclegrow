"use server";

import { db } from "../../../db";
import { sets } from "../../../db/schemas/app";
import { validateExerciseIdAndAuth } from "@/lib/actions/exercises";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";
import type { SetRecord } from "@/types/workout";

/**
 * セット記録を保存する（既存のセット記録を削除してから新規保存）
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @param setsToSave セット記録の配列
 * @returns 保存結果
 */
export async function saveSets({
  sessionId,
  exerciseId,
  sets: setsToSave,
}: {
  sessionId: string;
  exerciseId: string;
  sets: SetRecord[];
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

    // 有効なセットのみをフィルタリング（重量または回数または時間が0より大きい）
    const validSets = setsToSave.filter(
      (set) =>
        (set.weight !== undefined && set.weight !== null && set.weight > 0) ||
        set.reps > 0 ||
        (set.duration !== undefined &&
          set.duration !== null &&
          set.duration > 0)
    );

    // 有効なセットがない場合は、既存のセット記録を削除して終了
    if (validSets.length === 0) {
      await db
        .delete(sets)
        .where(
          and(eq(sets.sessionId, sessionId), eq(sets.exerciseId, exerciseId))
        );
      return {
        success: true,
        data: { count: 0 },
      };
    }

    // トランザクションで既存のセット記録を削除してから新規保存
    await db.transaction(async (tx) => {
      // 既存のセット記録を削除
      await tx
        .delete(sets)
        .where(
          and(eq(sets.sessionId, sessionId), eq(sets.exerciseId, exerciseId))
        );

      // 新しいセット記録を保存
      // データベーススキーマではweightが必須なので、weightがnull/undefinedの場合は0を使用
      // numeric型のフィールド（weight, rpe）は文字列として扱う必要がある
      const setsToInsert = validSets.map((set) => ({
        sessionId,
        exerciseId,
        setOrder: set.setOrder,
        weight: (set.weight !== undefined && set.weight !== null
          ? set.weight
          : 0
        ).toString(),
        reps: set.reps,
        rpe:
          set.rpe !== undefined && set.rpe !== null ? set.rpe.toString() : null,
        isWarmup: set.isWarmup ?? false,
        restSeconds: set.restSeconds ?? null,
        notes: set.notes ?? null,
        failure: set.failure ?? false,
      }));

      await tx.insert(sets).values(setsToInsert);
    });

    return {
      success: true,
      data: { count: validSets.length },
    };
  } catch (error: unknown) {
    console.error("セット記録保存エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "セット記録の保存に失敗しました",
    };
  }
}

/**
 * 指定セッション・種目のセット記録を取得する
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @returns セット記録の配列
 */
export async function getSets({
  sessionId,
  exerciseId,
}: {
  sessionId: string;
  exerciseId: string;
}): Promise<{
  success: boolean;
  error?: string;
  data?: SetRecord[];
}> {
  try {
    // exerciseIdがモックID（mock-で始まる）の場合は空の配列を返す
    if (exerciseId.startsWith("mock-")) {
      return {
        success: true,
        data: [],
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    const setsData = await db
      .select()
      .from(sets)
      .where(
        and(eq(sets.sessionId, sessionId), eq(sets.exerciseId, exerciseId))
      )
      .orderBy(sets.setOrder);

    const setsRecords: SetRecord[] = setsData.map((set) => ({
      id: set.id,
      setOrder: set.setOrder,
      weight: parseFloat(set.weight),
      reps: set.reps,
      rpe: set.rpe ? parseFloat(set.rpe) : null,
      isWarmup: set.isWarmup,
      restSeconds: set.restSeconds ?? null,
      notes: set.notes ?? null,
      failure: set.failure ?? undefined,
      // durationはデータベースに保存されていないため、nullを返す
      duration: null,
    }));

    return {
      success: true,
      data: setsRecords,
    };
  } catch (error: unknown) {
    console.error("セット記録取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "セット記録の取得に失敗しました",
    };
  }
}
