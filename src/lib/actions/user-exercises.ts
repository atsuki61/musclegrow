"use server";

import { db } from "../../../db";
import { exercises, userExerciseSettings } from "../../../db/schemas/app";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { Exercise } from "@/types/workout";

/**
 * ユーザーの設定（追加/削除状態）を反映した種目リストを取得する
 * これを使えば、端末が変わっても同じリストが表示される
 * @param userId ユーザーID
 */
export async function getExercisesWithUserPreferences(userId: string): Promise<{
  success: boolean;
  data?: Exercise[];
  error?: string;
}> {
  try {
    if (!userId || userId === "") {
      return {
        success: false,
        error: "ユーザーIDが無効です",
      };
    }

    // 1. 全種目を取得
    const allExercises = await db.select().from(exercises);

    // 2. ユーザーの設定を取得
    const settings = await db
      .select()
      .from(userExerciseSettings)
      .where(eq(userExerciseSettings.userId, userId));

    // 設定をMap化して検索しやすくする
    const settingsMap = new Map<string, boolean>();
    settings.forEach((s) => settingsMap.set(s.exerciseId, s.isVisible));

    // 3. マージ処理
    const mergedExercises = allExercises
      .map((ex) => {
        const isVisible = settingsMap.get(ex.id);

        // ユーザー設定がある場合、その設定を優先してtierを書き換える
        if (isVisible !== undefined) {
          return {
            ...ex,
            tier: isVisible ? "initial" : "selectable",
          } as Exercise;
        }

        // 設定がない場合、デフォルトのtierを使用
        // ただし、カスタム種目(userIdがあるもの)は作成者のみ表示
        if (ex.userId && ex.userId !== userId) {
          // 他人のカスタム種目は見えないようにする（念のため）
          return null;
        }

        return ex as Exercise;
      })
      .filter((ex): ex is Exercise => ex !== null);

    return { success: true, data: mergedExercises };
  } catch (error: unknown) {
    console.error("種目取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "種目の取得に失敗しました",
    };
  }
}

/**
 * 種目の表示/非表示設定を保存する
 * 追加ボタン・削除ボタンを押したときに呼ばれます
 * @param userId ユーザーID
 * @param exerciseId 種目ID
 * @param isVisible 表示するかどうか
 */
export async function toggleExerciseVisibility(
  userId: string,
  exerciseId: string,
  isVisible: boolean
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!userId || userId === "") {
      return {
        success: false,
        error: "ユーザーIDが無効です",
      };
    }

    await db
      .insert(userExerciseSettings)
      .values({
        userId,
        exerciseId,
        isVisible,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userExerciseSettings.userId, userExerciseSettings.exerciseId],
        set: { isVisible, updatedAt: new Date() },
      });

    revalidatePath("/record");
    return { success: true };
  } catch (error: unknown) {
    console.error("設定保存エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "設定の保存に失敗しました",
    };
  }
}
