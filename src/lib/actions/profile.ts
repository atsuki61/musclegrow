"use server";

import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { profiles } from "../../../db/schemas/app";
import { DEFAULT_BIG3_TARGETS, type Big3Targets } from "@/lib/big3";
import type { ProfileResponse } from "@/types/profile";

type ProfileRow = typeof profiles.$inferSelect;

function mapProfileRow(profile: ProfileRow): ProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    height: profile.height ? parseFloat(profile.height) : null,
    weight: profile.weight ? parseFloat(profile.weight) : null,
    bodyFat: profile.bodyFat ? parseFloat(profile.bodyFat) : null,
    muscleMass: profile.muscleMass ? parseFloat(profile.muscleMass) : null,
    big3TargetBenchPress: profile.big3TargetBenchPress
      ? parseFloat(profile.big3TargetBenchPress)
      : null,
    big3TargetSquat: profile.big3TargetSquat
      ? parseFloat(profile.big3TargetSquat)
      : null,
    big3TargetDeadlift: profile.big3TargetDeadlift
      ? parseFloat(profile.big3TargetDeadlift)
      : null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function getProfileData(userId: string): Promise<{
  success: boolean;
  error?: string;
  data?: ProfileResponse;
}> {
  try {
    let profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      const [newProfile] = await db
        .insert(profiles)
        .values({ userId })
        .returning();
      profile = [newProfile];
    }

    return {
      success: true,
      data: mapProfileRow(profile[0]),
    };
  } catch (error) {
    console.error("プロフィール取得エラー:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "プロフィールの取得に失敗しました",
    };
  }
}

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
  } catch (error) {
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
