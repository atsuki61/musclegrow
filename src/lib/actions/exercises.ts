"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "../../../db";
import { exercises } from "../../../db/schemas/app";
import { eq, and, or, isNull } from "drizzle-orm";
import type { Exercise } from "@/types/workout";

type ExerciseRow = typeof exercises.$inferSelect;

const fetchExercisesForUser = unstable_cache(
  async (userKey: string): Promise<Exercise[]> => {
    // 修正: "guest" の場合も空配列を返さず、共通マスタを取得する

    const exercisesList = await db
      .select()
      .from(exercises)
      .where(
        userKey === "guest"
          ? isNull(exercises.userId) // ゲスト: 共通マスタのみ
          : or(isNull(exercises.userId), eq(exercises.userId, userKey)) // ログイン: 共通 + 自分用
      )
      .orderBy(exercises.createdAt);

    return exercisesList.map(mapExerciseRow);
  },
  ["exercises"],
  { tags: ["exercises"] }
);

function mapExerciseRow(ex: ExerciseRow): Exercise {
  return {
    id: ex.id,
    name: ex.name,
    nameEn: ex.nameEn ?? undefined,
    bodyPart: ex.bodyPart as Exercise["bodyPart"],
    muscleSubGroup:
      (ex.muscleSubGroup as Exercise["muscleSubGroup"] | null) ?? undefined,
    primaryEquipment:
      (ex.primaryEquipment as Exercise["primaryEquipment"] | null) ?? undefined,
    tier: ex.tier as Exercise["tier"],
    isBig3: ex.isBig3,
    userId: ex.userId ?? undefined,
    createdAt: ex.createdAt,
  };
}

/**
 * 種目IDのバリデーションと認証チェックを行う共通関数
 */
export async function validateExerciseIdAndAuth(
  userId: string,
  exerciseId: string
): Promise<
  { success: true; userId: string } | { success: false; error: string }
> {
  if (exerciseId.startsWith("mock-")) {
    return {
      success: false,
      error: "モックデータは保存できません",
    };
  }

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
export async function saveExercise(
  userId: string,
  exercise: Exercise
): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise;
}> {
  try {
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
        userId: userId,
      })
      .returning();

    const response = {
      success: true,
      data: mapExerciseRow(savedExercise),
    };

    await revalidateTag("exercises");

    return response;
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
 * @param userId ユーザーID（nullの場合はゲスト）
 */
export async function getExercises(userId: string | null): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise[];
}> {
  try {
    const cacheKey = userId ?? "guest";
    const exercisesData = await fetchExercisesForUser(cacheKey);

    return {
      success: true,
      data: exercisesData,
    };
  } catch (error: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.error("種目取得エラー:", error);
    }
    return {
      success: true,
      data: [],
    };
  }
}
