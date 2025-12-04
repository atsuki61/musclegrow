"use client";

import type { ProfileResponse } from "@/types/profile";

const GUEST_PROFILE_KEY = "musclegrow_guest_profile";

/**
 * ゲストプロフィールを取得
 */
export function getGuestProfile(): ProfileResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(GUEST_PROFILE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ProfileResponse;
  } catch {
    return null;
  }
}

/**
 * ゲストプロフィールを保存
 */
export function saveGuestProfile(data: {
  height: number;
  weight: number;
  bodyFat: number;
  muscleMass: number;
}): ProfileResponse {
  const current = getGuestProfile() || {
    id: "guest-profile",
    userId: "guest",
    big3TargetBenchPress: 100,
    big3TargetSquat: 120,
    big3TargetDeadlift: 140,
    createdAt: new Date().toISOString(),
  };

  const updated: ProfileResponse = {
    ...current,
    height: data.height,
    weight: data.weight,
    bodyFat: data.bodyFat,
    muscleMass: data.muscleMass,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(updated));
  }

  return updated;
}
