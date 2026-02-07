"use server";

import { revalidateTag } from "next/cache";
import { getAuthUserId } from "@/lib/auth-session-server";
import { db } from "../../../db";
import { profiles, profileHistory } from "../../../db/schemas/app";
import { and, eq, gte, lte } from "drizzle-orm";
import { updateProfileSchema } from "@/lib/validations";
import { getValidationErrorMessage } from "@/lib/validations";
import { calculateBMI } from "@/lib/utils/bmi";
import type { InferSelectModel } from "drizzle-orm";
import type { ProfileResponse } from "@/types/profile";
import { DEFAULT_BIG3_TARGETS, type Big3Targets } from "@/lib/big3";

// データベーススキーマから型を導出
type ProfileRow = InferSelectModel<typeof profiles>;

/**
 * 文字列またはnullの値を数値に変換する
 */
function parseNullableFloat(value: string | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  return parseFloat(value);
}

/**
 * データベースのプロフィールデータをAPIレスポンス形式に変換する
 */
function transformProfileToResponse(profile: ProfileRow): ProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    height: parseNullableFloat(profile.height),
    weight: parseNullableFloat(profile.weight),
    bodyFat: parseNullableFloat(profile.bodyFat),
    muscleMass: parseNullableFloat(profile.muscleMass),
    big3TargetBenchPress: parseNullableFloat(profile.big3TargetBenchPress),
    big3TargetSquat: parseNullableFloat(profile.big3TargetSquat),
    big3TargetDeadlift: parseNullableFloat(profile.big3TargetDeadlift),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

/**
 * 現在ログイン中のユーザーのプロフィールを取得する
 * プロフィールが存在しない場合は新規作成して返します。
 */
export async function getProfile(): Promise<{
  success: boolean;
  data?: ProfileResponse;
  error?: string;
}> {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: "認証が必要です" };
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId,
        })
        .returning();

      return {
        success: true,
        data: transformProfileToResponse(newProfile),
      };
    }

    return {
      success: true,
      data: transformProfileToResponse(profile),
    };
  } catch (error: unknown) {
    console.error("プロフィール取得エラー:", error);
    return {
      success: false,
      error: "プロフィールの取得に失敗しました",
    };
  }
}

/**
 * プロフィール情報を更新する
 */
export async function updateProfile(data: unknown): Promise<{
  success: boolean;
  data?: ProfileResponse;
  error?: string;
}> {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: "認証が必要です" };
    }

    // バリデーション
    const validationResult = updateProfileSchema.safeParse(data);

    if (!validationResult.success) {
      return {
        success: false,
        error: getValidationErrorMessage(validationResult.error),
      };
    }

    const updateData = validationResult.data;

    // 更新データを準備
    const dbUpdateData: {
      height?: string;
      weight?: string;
      bodyFat?: string;
      muscleMass?: string;
      big3TargetBenchPress?: string;
      big3TargetSquat?: string;
      big3TargetDeadlift?: string;
    } = {};

    const fieldMappings: Array<
      [keyof typeof updateData, keyof typeof dbUpdateData]
    > = [
      ["height", "height"],
      ["weight", "weight"],
      ["bodyFat", "bodyFat"],
      ["muscleMass", "muscleMass"],
      ["big3TargetBenchPress", "big3TargetBenchPress"],
      ["big3TargetSquat", "big3TargetSquat"],
      ["big3TargetDeadlift", "big3TargetDeadlift"],
    ];

    for (const [sourceKey, targetKey] of fieldMappings) {
      const value = updateData[sourceKey];
      if (value !== undefined) {
        dbUpdateData[targetKey] = value.toString();
      }
    }

    if (Object.keys(dbUpdateData).length === 0) {
      return { success: false, error: "更新するデータがありません" };
    }

    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    let updatedProfile;

    if (existingProfile) {
      [updatedProfile] = await db
        .update(profiles)
        .set({ ...dbUpdateData, updatedAt: new Date() })
        .where(eq(profiles.userId, userId))
        .returning();
    } else {
      [updatedProfile] = await db
        .insert(profiles)
        .values({
          userId,
          ...dbUpdateData,
        })
        .returning();
    }

    // プロフィール履歴を保存
    if (updatedProfile) {
      const height = updatedProfile.height
        ? parseFloat(updatedProfile.height)
        : null;
      const weight = updatedProfile.weight
        ? parseFloat(updatedProfile.weight)
        : null;

      const bmi =
        height && weight && height > 0 && weight > 0
          ? calculateBMI(height, weight)
          : null;

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const [existingHistory] = await db
        .select()
        .from(profileHistory)
        .where(
          and(
            eq(profileHistory.userId, userId),
            gte(profileHistory.recordedAt, startOfDay),
            lte(profileHistory.recordedAt, endOfDay)
          )
        )
        .limit(1);

      if (existingHistory) {
        await db
          .update(profileHistory)
          .set({
            height: updatedProfile.height,
            weight: updatedProfile.weight,
            bodyFat: updatedProfile.bodyFat,
            muscleMass: updatedProfile.muscleMass,
            bmi: bmi ? bmi.toString() : null,
            recordedAt: now,
          })
          .where(eq(profileHistory.id, existingHistory.id));
      } else {
        await db.insert(profileHistory).values({
          userId,
          height: updatedProfile.height,
          weight: updatedProfile.weight,
          bodyFat: updatedProfile.bodyFat,
          muscleMass: updatedProfile.muscleMass,
          bmi: bmi ? bmi.toString() : null,
          recordedAt: now,
        });
      }
    }

    revalidateTag("profile:history");

    return {
      success: true,
      data: transformProfileToResponse(updatedProfile),
    };
  } catch (error: unknown) {
    console.error("プロフィール更新エラー:", error);
    return {
      success: false,
      error: "プロフィールの更新に失敗しました",
    };
  }
}

/**
 * 既存のコードとの互換性のためのエイリアス
 * @deprecated Use getProfile() instead
 */
export const getProfileData = async (userId: string) => {
  // userId引数は無視して現在のセッションユーザーを使用するが、
  // 既存の実装がuserIdを渡しているので型定義は合わせる
  // ただし、本来はサーバーサイドでgetAuthUserId()を使うべき。
  // ここではgetProfile()を呼び出す形にする。
  // ※注意: もしuserIdが現在のユーザーと異なる場合、
  // getProfile()は現在のユーザーのデータを返すため、挙動が変わる可能性がある。
  // しかし、getProfileDataは "現在ログイン中のユーザー" のプロフィールを取得する用途で使われているはず。
  return await getProfile();
};

/**
 * Big3の目標値を取得する
 * @param userId ユーザーID（nullの場合はゲスト）
 */
export async function getBig3TargetValues(userId: string | null): Promise<{
  success: boolean;
  error?: string;
  data?: Big3Targets;
}> {
  try {
    if (!userId) {
      return {
        success: true,
        data: DEFAULT_BIG3_TARGETS,
      };
    }

    const [profile] = await db
      .select({
        benchPress: profiles.big3TargetBenchPress,
        squat: profiles.big3TargetSquat,
        deadlift: profiles.big3TargetDeadlift,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      return {
        success: true,
        data: DEFAULT_BIG3_TARGETS,
      };
    }

    return {
      success: true,
      data: {
        benchPress:
          profile.benchPress !== null
            ? parseFloat(profile.benchPress)
            : DEFAULT_BIG3_TARGETS.benchPress,
        squat:
          profile.squat !== null
            ? parseFloat(profile.squat)
            : DEFAULT_BIG3_TARGETS.squat,
        deadlift:
          profile.deadlift !== null
            ? parseFloat(profile.deadlift)
            : DEFAULT_BIG3_TARGETS.deadlift,
      },
    };
  } catch (error: unknown) {
    console.error("Big3ターゲット取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Big3ターゲットの取得に失敗しました",
    };
  }
}
