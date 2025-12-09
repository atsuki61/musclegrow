"use server";

import { revalidateTag } from "next/cache";
import { db } from "../../../db";
import { sets, workoutSessions } from "../../../db/schemas/app";
import { validateExerciseIdAndAuth } from "@/lib/actions/exercises";
import { eq, and, max, lt, desc } from "drizzle-orm";
import type { SetRecord } from "@/types/workout";
/**
 * セット記録を保存する（既存のセット記録を削除してから新規保存）
 * @param userId ユーザーID
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @param setsToSave セット記録の配列
 * @returns 保存結果
 */
export async function saveSets(
  userId: string,
  {
    sessionId,
    exerciseId,
    sets: setsToSave,
  }: {
    sessionId: string;
    exerciseId: string;
    sets: SetRecord[];
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: { count: number };
}> {
  try {
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
    // db.transactionはトランザクションを管理する関数
    // txはデータベース操作を行うための関数を提供する
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

    await Promise.all([
      revalidateTag("stats:exercise"),
      revalidateTag("stats:big3"),
    ]);

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
 * @param userId ユーザーID
 * @param sessionId ワークアウトセッションID
 * @param exerciseId 種目ID
 * @returns セット記録の配列
 */
export async function getSets(
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

/**
 * ユーザーの全期間の種目別最大重量を取得する
 * @param userId ユーザーID
 * @returns Record<exerciseId, maxWeight>
 */
export async function getUserMaxWeights(userId: string): Promise<{
  success: boolean;
  data?: Record<string, number>;
  error?: string;
}> {
  try {
    // 各種目の最大重量を集計
    const maxWeightsData = await db
      .select({
        exerciseId: sets.exerciseId,
        maxWeight: max(sets.weight),
      })
      .from(sets)
      .innerJoin(workoutSessions, eq(sets.sessionId, workoutSessions.id))
      .where(eq(workoutSessions.userId, userId))
      .groupBy(sets.exerciseId);

    const result: Record<string, number> = {};

    for (const record of maxWeightsData) {
      // exerciseId と maxWeight が存在することを確認
      if (record.exerciseId && record.maxWeight) {
        const weight = parseFloat(record.maxWeight);
        if (!isNaN(weight) && weight > 0) {
          result[record.exerciseId] = weight;
        }
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    // エラーの型チェック
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    console.error("最大重量取得エラー:", errorMessage);
    return {
      success: false,
      error: "最大重量の取得に失敗しました",
    };
  }
}

/**
 * 指定された種目の最新のトレーニング記録を取得する
 * @param userId ユーザーID
 * @param exerciseId 種目ID
 * @param beforeDate この日付より前の記録を取得（オプション）
 */
export async function getLatestSetRecord(
  userId: string,
  exerciseId: string,
  beforeDate?: Date
): Promise<{
  success: boolean;
  data?: { sets: SetRecord[]; date: Date } | null;
  error?: string;
}> {
  try {
    let dateCondition = undefined;
    if (beforeDate) {
      // Drizzleの日付比較は文字列で行う (YYYY-MM-DD)
      const dateStr = beforeDate.toISOString().split("T")[0];
      dateCondition = lt(workoutSessions.date, dateStr);
    }

    // 最新のセッションを取得
    const [latestSession] = await db
      .select({
        id: workoutSessions.id,
        date: workoutSessions.date,
      })
      .from(workoutSessions)
      .innerJoin(sets, eq(sets.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(sets.exerciseId, exerciseId),
          dateCondition
        )
      )
      .orderBy(desc(workoutSessions.date))
      .limit(1);

    if (!latestSession) {
      return { success: true, data: null };
    }

    // そのセッションのセット記録を取得
    const setsData = await db
      .select()
      .from(sets)
      .where(
        and(
          eq(sets.sessionId, latestSession.id),
          eq(sets.exerciseId, exerciseId)
        )
      )
      .orderBy(sets.setOrder);

    const setRecords: SetRecord[] = setsData.map((s) => ({
      id: s.id,
      setOrder: s.setOrder,
      weight: parseFloat(s.weight),
      reps: s.reps,
      rpe: s.rpe ? parseFloat(s.rpe) : null,
      isWarmup: s.isWarmup,
      restSeconds: s.restSeconds ?? null,
      notes: s.notes ?? null,
      failure: s.failure ?? undefined,
      duration: null,
    }));

    return {
      success: true,
      data: {
        sets: setRecords,
        date: new Date(latestSession.date),
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    console.error("最新記録取得エラー:", errorMessage);
    return { success: false, error: "記録の取得に失敗しました" };
  }
}
