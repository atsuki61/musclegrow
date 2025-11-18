import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "../../../../db";
import { profiles, profileHistory } from "../../../../db/schemas/app";
import { and, eq, gte, lte } from "drizzle-orm";
import { updateProfileSchema } from "@/lib/validations";
import { getValidationErrorMessage } from "@/lib/validations";
import { calculateBMI } from "@/lib/utils/bmi";
import type { InferSelectModel } from "drizzle-orm";

// データベーススキーマから型を導出
type ProfileRow = InferSelectModel<typeof profiles>;

/**
 * 認証チェックを行い、ユーザーIDを取得する
 *
 * @returns ユーザーID（認証されていない場合はnull）
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: h,
  });

  return session?.user?.id ?? null;
}

/**
 * 認証エラーレスポンスを返す
 */
function createUnauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    },
    { status: 401 }
  );
}

/**
 * 文字列またはnullの値を数値に変換する
 *
 * @param value 変換対象の値
 * @returns 数値（nullの場合はnull）
 */
function parseNullableFloat(value: string | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  return parseFloat(value);
}

/**
 * データベースのプロフィールデータをAPIレスポンス形式に変換する
 *
 * @param profile データベースから取得したプロフィールデータ
 * @returns APIレスポンス用のプロフィールデータ
 */
function transformProfileToResponse(profile: ProfileRow) {
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
 * プロフィール取得API（GET /api/profile）
 *
 * 現在ログイン中のユーザーのプロフィールを取得します。
 * プロフィールが存在しない場合は新規作成して返します。
 */
export async function GET() {
  try {
    // 認証チェック
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return createUnauthorizedResponse();
    }

    // プロフィールを取得
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    // プロフィールが存在しない場合は新規作成
    if (!profile) {
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId,
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: transformProfileToResponse(newProfile),
      });
    }

    // プロフィールが存在する場合は返す
    return NextResponse.json({
      success: true,
      data: transformProfileToResponse(profile),
    });
  } catch (error: unknown) {
    console.error("プロフィール取得エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "プロフィールの取得に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * プロフィール更新API（PUT /api/profile）
 *
 * プロフィール情報を更新します。
 */
export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return createUnauthorizedResponse();
    }

    // リクエストボディを取得
    const body = await request.json();

    // バリデーション
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: getValidationErrorMessage(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // 更新データを準備（undefinedのフィールドは除外）
    const dbUpdateData: {
      height?: string;
      weight?: string;
      bodyFat?: string;
      muscleMass?: string;
      big3TargetBenchPress?: string;
      big3TargetSquat?: string;
      big3TargetDeadlift?: string;
    } = {};

    // 更新フィールドをマッピング
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

    // 更新データが空の場合はエラーを返す
    if (Object.keys(dbUpdateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "更新するデータがありません",
          },
        },
        { status: 400 }
      );
    }

    // プロフィールが存在するか確認
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    let updatedProfile;

    if (existingProfile) {
      // 既存のプロフィールを更新
      [updatedProfile] = await db
        .update(profiles)
        .set(dbUpdateData)
        .where(eq(profiles.userId, userId))
        .returning();
    } else {
      // プロフィールが存在しない場合は新規作成
      [updatedProfile] = await db
        .insert(profiles)
        .values({
          userId,
          ...dbUpdateData,
        })
        .returning();
    }

    // プロフィール履歴を保存（更新時のみ）
    if (existingProfile) {
      const height = updatedProfile.height
        ? parseFloat(updatedProfile.height)
        : null;
      const weight = updatedProfile.weight
        ? parseFloat(updatedProfile.weight)
        : null;

      // BMIを計算（身長と体重が両方存在する場合のみ）
      const bmi =
        height && weight && height > 0 && weight > 0
          ? calculateBMI(height, weight)
          : null;

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // 同じ日に記録された履歴がある場合は上書き、なければ新規作成
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

    return NextResponse.json({
      success: true,
      data: transformProfileToResponse(updatedProfile),
    });
  } catch (error: unknown) {
    console.error("プロフィール更新エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "プロフィールの更新に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}
