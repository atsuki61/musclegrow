import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "../../../../db";
import { profiles } from "../../../../db/schemas/app";
import { eq } from "drizzle-orm";
import { updateProfileSchema } from "@/lib/validations";
import { getValidationErrorMessage } from "@/lib/validations";

/**
 * 認証チェックを行い、ユーザーIDを取得する
 *
 * @returns ユーザーID（認証されていない場合はnull）
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
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
 * データベースのプロフィールデータをAPIレスポンス形式に変換する
 *
 * @param profile データベースから取得したプロフィールデータ
 * @returns APIレスポンス用のプロフィールデータ
 */
function transformProfileToResponse(profile: {
  id: string;
  userId: string;
  height: string | null;
  weight: string | null;
  bodyFat: string | null;
  muscleMass: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: profile.id,
    userId: profile.userId,
    height: profile.height ? parseFloat(profile.height) : null,
    weight: profile.weight ? parseFloat(profile.weight) : null,
    bodyFat: profile.bodyFat ? parseFloat(profile.bodyFat) : null,
    muscleMass: profile.muscleMass ? parseFloat(profile.muscleMass) : null,
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
  } catch (error) {
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
    } = {};

    if (updateData.height !== undefined) {
      dbUpdateData.height = updateData.height.toString();
    }
    if (updateData.weight !== undefined) {
      dbUpdateData.weight = updateData.weight.toString();
    }
    if (updateData.bodyFat !== undefined) {
      dbUpdateData.bodyFat = updateData.bodyFat.toString();
    }
    if (updateData.muscleMass !== undefined) {
      dbUpdateData.muscleMass = updateData.muscleMass.toString();
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

    return NextResponse.json({
      success: true,
      data: transformProfileToResponse(updatedProfile),
    });
  } catch (error) {
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
