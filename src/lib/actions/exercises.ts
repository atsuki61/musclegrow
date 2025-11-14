"use server";

import { db } from "../../../db";
import { exercises } from "../../../db/schemas/app";
import { getCurrentUserId } from "@/lib/auth-utils";
import { eq, and, or, isNull } from "drizzle-orm";
import type { Exercise } from "@/types/workout";

/**
 * 種目IDのバリデーションと認証チェックを行う共通関数
 * @param exerciseId 種目ID
 * @returns バリデーション結果（成功時はuserId、失敗時はエラー情報）
 */
export async function validateExerciseIdAndAuth(
  exerciseId: string
): Promise<
  | { success: true; userId: string }
  | { success: false; error: string }
> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      error: "認証が必要です",
    };
  }

  // exerciseIdがモックID（mock-で始まる）の場合はエラーを返す
  if (exerciseId.startsWith("mock-")) {
    return {
      success: false,
      error: "モックデータは保存できません",
    };
  }

  // exerciseIdがデータベースに存在するか確認
  const [exercise] = await db
    .select()
    .from(exercises)
    .where(
      and(
        eq(exercises.id, exerciseId),
        or(isNull(exercises.userId), eq(exercises.userId, userId))
      )
    )
    .limit(1);

  if (!exercise) {
    return {
      success: false,
      error: `種目ID "${exerciseId}" が見つかりません`,
    };
  }

  return {
    success: true,
    userId,
  };
}

/**
 * 種目を保存する（カスタム種目）
 */
export async function saveExercise(exercise: Exercise): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    // カスタム種目をデータベースに保存
    const [savedExercise] = await db
      .insert(exercises)
      .values({
        id: exercise.id,
        name: exercise.name,
        nameEn: exercise.nameEn ?? null,
        bodyPart: exercise.bodyPart,
        muscleSubGroup: exercise.muscleSubGroup ?? null,
        primaryEquipment: exercise.primaryEquipment ?? null,
        tier: exercise.tier,
        isBig3: exercise.isBig3,
        userId: userId, // ユーザー独自種目として保存
      })
      .returning();

    return {
      success: true,
      data: {
        id: savedExercise.id,
        name: savedExercise.name,
        nameEn: savedExercise.nameEn ?? undefined,
        bodyPart: savedExercise.bodyPart as Exercise["bodyPart"],
        muscleSubGroup:
          (savedExercise.muscleSubGroup as Exercise["muscleSubGroup"] | null) ??
          undefined,
        primaryEquipment:
          (savedExercise.primaryEquipment as
            | Exercise["primaryEquipment"]
            | null) ?? undefined,
        tier: savedExercise.tier as Exercise["tier"],
        isBig3: savedExercise.isBig3,
        userId: savedExercise.userId ?? undefined,
        createdAt: savedExercise.createdAt,
      },
    };
  } catch (error: unknown) {
    console.error("種目保存エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "種目の保存に失敗しました",
    };
  }
}

/**
 * 種目一覧を取得する（共通マスタ + ユーザー独自種目）
 */
export async function getExercises(): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise[];
}> {
  try {
    const userId = await getCurrentUserId();

    // 認証されていない場合は空の配列を返す（モックデータを使用）
    // これにより、データベースクエリエラーを回避し、クライアント側でモックデータを使用できる
    if (!userId) {
      return {
        success: true,
        data: [],
      };
    }

    // 共通マスタ（userIdがnull）とユーザー独自種目（userIdが現在のユーザーID）を取得
    const exercisesList = await db
      .select()
      .from(exercises)
      .where(or(isNull(exercises.userId), eq(exercises.userId, userId)))
      .orderBy(exercises.createdAt);

    const exercisesData: Exercise[] = exercisesList.map((ex) => ({
      id: ex.id,
      name: ex.name,
      nameEn: ex.nameEn ?? undefined,
      bodyPart: ex.bodyPart as Exercise["bodyPart"],
      muscleSubGroup:
        (ex.muscleSubGroup as Exercise["muscleSubGroup"] | null) ?? undefined,
      primaryEquipment:
        (ex.primaryEquipment as Exercise["primaryEquipment"] | null) ??
        undefined,
      tier: ex.tier as Exercise["tier"],
      isBig3: ex.isBig3,
      userId: ex.userId ?? undefined,
      createdAt: ex.createdAt,
    }));

    return {
      success: true,
      data: exercisesData,
    };
  } catch (error: unknown) {
    // 開発環境でのみエラーをログに出力
    if (process.env.NODE_ENV === "development") {
      console.error("種目取得エラー:", error);
    }
    // エラー時は空の配列を返す（クライアント側でモックデータを使用）
    return {
      success: true,
      data: [],
    };
  }
}
