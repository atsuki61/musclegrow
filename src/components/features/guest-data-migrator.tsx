"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { useAuthSession } from "@/lib/auth-session-context";
import { parseStorageKey } from "@/lib/local-storage-history";
import { getSessionDetailsFromStorage } from "@/lib/local-storage-session-details";
import {
  getExercises,
  saveWorkoutSession,
  saveSets,
  saveCardioRecords,
  getSessionDetails,
  saveExercise,
} from "@/lib/api";
import { toggleExerciseVisibility } from "@/lib/actions/user-exercises";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
// 追加: プロフィール用ユーティリティ
import { getGuestProfile } from "@/lib/local-storage-profile";

// ストレージキー定義
const GUEST_DATA_MIGRATED_KEY = "guest_data_migrated";
const OLD_EXERCISES_KEY = "exercises"; // 旧仕様のキー
const GUEST_CUSTOM_EXERCISES_KEY = "musclegrow_guest_custom_exercises"; // 新仕様のキー
const GUEST_SETTINGS_KEY = "musclegrow_guest_settings"; // 新仕様の設定キー
const GUEST_PROFILE_KEY = "musclegrow_guest_profile"; // 追加: プロフィールキー

export function GuestDataMigrator() {
  const { userId } = useAuthSession();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // 未ログイン、または既に処理開始済み、またはサーバーサイドなら何もしない
    if (!userId) return;
    if (hasStartedRef.current) return;
    if (typeof window === "undefined") return;

    // 既に移行済みフラグがあれば何もしない（初回のみ実行のガード）
    const migratedFlag = window.localStorage.getItem(GUEST_DATA_MIGRATED_KEY);
    if (migratedFlag === "true") {
      hasStartedRef.current = true;
      return;
    }

    // 移行処理開始
    hasStartedRef.current = true;

    (async () => {
      try {
        await migrateGuestData(userId);
      } catch (error) {
        console.error("ゲストデータ移行中にエラーが発生しました:", error);
      }
    })();
  }, [userId]);

  return null;
}

/**
 * ローカルストレージからカスタム種目を読み込む
 */
function loadLocalCustomExercises(): Exercise[] {
  if (typeof window === "undefined") return [];
  const exercises: Exercise[] = [];
  const ids = new Set<string>();

  try {
    // 1. 旧キーから読み込み
    const oldStored = localStorage.getItem(OLD_EXERCISES_KEY);
    if (oldStored) {
      const parsed = JSON.parse(oldStored) as Exercise[];
      parsed.forEach((ex) => {
        if (!ex.id.startsWith("mock-") && !ids.has(ex.id)) {
          exercises.push(ex);
          ids.add(ex.id);
        }
      });
    }

    // 2. 新キーから読み込み
    const newStored = localStorage.getItem(GUEST_CUSTOM_EXERCISES_KEY);
    if (newStored) {
      const parsed = JSON.parse(newStored) as Exercise[];
      parsed.forEach((ex) => {
        if (!ids.has(ex.id)) {
          exercises.push(ex);
          ids.add(ex.id);
        }
      });
    }
  } catch {
    // ignore json parse error
  }
  return exercises;
}

/**
 * ゲスト時の種目設定（表示/非表示）をDBへ移行
 */
async function migrateExerciseSettings(userId: string) {
  if (typeof window === "undefined") return;
  try {
    const settingsRaw = localStorage.getItem(GUEST_SETTINGS_KEY);
    if (!settingsRaw) return;

    const settings = JSON.parse(settingsRaw) as Record<string, boolean>;
    const promises = Object.entries(settings).map(([exerciseId, isVisible]) =>
      toggleExerciseVisibility(userId, exerciseId, isVisible)
    );

    await Promise.all(promises);
  } catch (e) {
    console.error("設定の移行に失敗:", e);
  }
}

/**
 * ゲスト時のカスタム種目をDBへ保存
 */
async function migrateCustomExercises(
  userId: string,
  localExercises: Exercise[]
) {
  for (const exercise of localExercises) {
    try {
      await saveExercise(userId, exercise);
    } catch (e) {
      console.warn(`カスタム種目(${exercise.name})の移行スキップ:`, e);
    }
  }
}

/**
 * ゲスト時のプロフィールをDBへ移行 (追加)
 */
async function migrateProfile() {
  if (typeof window === "undefined") return;

  const guestProfile = getGuestProfile();
  if (!guestProfile) return;

  // DB保存用データに変換
  const data = {
    height: guestProfile.height,
    weight: guestProfile.weight,
    bodyFat: guestProfile.bodyFat,
    muscleMass: guestProfile.muscleMass,
    big3TargetBenchPress: guestProfile.big3TargetBenchPress,
    big3TargetSquat: guestProfile.big3TargetSquat,
    big3TargetDeadlift: guestProfile.big3TargetDeadlift,
  };

  try {
    // API経由で保存 (PUT /api/profile)
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.error("プロフィール移行エラー:", e);
  }
}

// --- 既存のヘルパー関数群 ---

function createNameBodyPartKey(name: string, bodyPart: string): string {
  return `${name}__${bodyPart}`;
}

function collectRecordedDatesFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  const dates = new Set<string>();
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const parsed = parseStorageKey(key);
      if (!parsed) continue;
      dates.add(parsed.dateStr);
    }
  } catch (e) {
    console.error(e);
  }
  return Array.from(dates).sort();
}

function createExerciseMappingData(
  localExercises: Exercise[],
  dbExercises: Exercise[]
) {
  const localExerciseById = new Map<string, Exercise>();
  localExercises.forEach((ex) => localExerciseById.set(ex.id, ex));

  const dbExerciseIds = new Set<string>();
  const dbExerciseIdByNameAndBodyPart = new Map<string, string>();

  dbExercises.forEach((ex) => {
    dbExerciseIds.add(ex.id);
    const key = createNameBodyPartKey(ex.name, ex.bodyPart);
    if (!dbExerciseIdByNameAndBodyPart.has(key)) {
      dbExerciseIdByNameAndBodyPart.set(key, ex.id);
    }
  });

  return { localExerciseById, dbExerciseIds, dbExerciseIdByNameAndBodyPart };
}

function createExerciseIdMapper(
  localExerciseById: Map<string, Exercise>,
  dbExerciseIds: Set<string>,
  dbExerciseIdByNameAndBodyPart: Map<string, string>,
  dbExercises: Exercise[]
) {
  return (localExerciseId: string): string | null => {
    if (
      !localExerciseId.startsWith("mock-") &&
      dbExerciseIds.has(localExerciseId)
    ) {
      return localExerciseId;
    }
    const localExercise = localExerciseById.get(localExerciseId);
    if (!localExercise) return null;

    const key = createNameBodyPartKey(
      localExercise.name,
      localExercise.bodyPart
    );
    const mappedId = dbExerciseIdByNameAndBodyPart.get(key);
    if (mappedId) return mappedId;

    const fallback = dbExercises.find((ex) => ex.name === localExercise.name);
    return fallback ? fallback.id : null;
  };
}

async function getExistingExerciseIds(userId: string, sessionId: string) {
  const workoutExerciseIds = new Set<string>();
  const cardioExerciseIds = new Set<string>();
  const details = await getSessionDetails(userId, sessionId);
  if (details.success && details.data) {
    details.data.workoutExercises.forEach((e) =>
      workoutExerciseIds.add(e.exerciseId)
    );
    details.data.cardioExercises.forEach((e) =>
      cardioExerciseIds.add(e.exerciseId)
    );
  }
  return { workoutExerciseIds, cardioExerciseIds };
}

async function migrateDateRecords(
  userId: string,
  dateStr: string,
  mapExerciseId: (id: string) => string | null,
  workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>,
  cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>
) {
  const sessionResult = await saveWorkoutSession(userId, { date: dateStr });
  if (!sessionResult.success || !sessionResult.data) return false;
  const sessionId = sessionResult.data.id;

  const { workoutExerciseIds, cardioExerciseIds } =
    await getExistingExerciseIds(userId, sessionId);

  // 筋トレ移行
  for (const { exerciseId, sets } of workoutExercises) {
    const mappedId = mapExerciseId(exerciseId);
    if (!mappedId || workoutExerciseIds.has(mappedId)) continue;
    await saveSets(userId, { sessionId, exerciseId: mappedId, sets });
  }

  // 有酸素移行
  for (const { exerciseId, records } of cardioExercises) {
    const mappedId = mapExerciseId(exerciseId);
    if (!mappedId || cardioExerciseIds.has(mappedId)) continue;
    await saveCardioRecords(userId, {
      sessionId,
      exerciseId: mappedId,
      records,
    });
  }
  return true;
}

/**
 * メイン移行プロセス
 */
async function migrateGuestData(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. ローカルのカスタム種目をリストアップ
  const localCustomExercises = loadLocalCustomExercises();

  // 2. カスタム種目をDBへ保存
  if (localCustomExercises.length > 0) {
    await migrateCustomExercises(userId, localCustomExercises);
  }

  // 3. 設定（表示/非表示）をDBへ移行
  await migrateExerciseSettings(userId);

  // 4. プロフィールをDBへ移行 (追加)
  await migrateProfile();

  // 5. 最新のDB種目一覧を取得
  const exercisesResult = await getExercises(userId);
  const dbExercises =
    exercisesResult.success && exercisesResult.data ? exercisesResult.data : [];
  if (dbExercises.length === 0) return;

  // 6. マッピング準備
  const localExerciseById = new Map<string, Exercise>();
  localCustomExercises.forEach((ex) => localExerciseById.set(ex.id, ex));

  const { dbExerciseIds, dbExerciseIdByNameAndBodyPart } =
    createExerciseMappingData([], dbExercises);

  const { mockInitialExercises } = await import("@/lib/mock-exercises");
  mockInitialExercises.forEach((ex) => localExerciseById.set(ex.id, ex));

  const mapExerciseId = createExerciseIdMapper(
    localExerciseById,
    dbExerciseIds,
    dbExerciseIdByNameAndBodyPart,
    dbExercises
  );

  // 7. 記録データの移行
  const dates = collectRecordedDatesFromStorage();
  let hadError = false;

  for (const dateStr of dates) {
    const date = new Date(`${dateStr}T00:00:00`);
    const { workoutExercises, cardioExercises } = getSessionDetailsFromStorage({
      date,
    });
    if (workoutExercises.length === 0 && cardioExercises.length === 0) continue;

    const yyyyMMdd = format(date, "yyyy-MM-dd");
    const success = await migrateDateRecords(
      userId,
      yyyyMMdd,
      mapExerciseId,
      workoutExercises,
      cardioExercises
    );
    if (!success) hadError = true;
  }

  // 8. 完了処理
  if (!hadError) {
    cleanupGuestLocalStorage();
    window.localStorage.setItem(GUEST_DATA_MIGRATED_KEY, "true");
  }
}

function cleanupGuestLocalStorage() {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (
      key.startsWith("workout_") ||
      key.startsWith("cardio_") ||
      key === OLD_EXERCISES_KEY ||
      key === GUEST_CUSTOM_EXERCISES_KEY ||
      key === GUEST_SETTINGS_KEY ||
      key === GUEST_PROFILE_KEY // 追加
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => window.localStorage.removeItem(k));
}
