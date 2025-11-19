// src/lib/max-weight.ts

export type MaxWeightsMap = Record<string, number>;

const CACHE_KEY = "max_weights_cache_v1";
const CACHE_VERSION_KEY = "max_weights_version_v1";
const CURRENT_VERSION = 1;

/** localStorage から最大重量キャッシュをロード */
export function loadMaxWeightsCache(): MaxWeightsMap {
  if (typeof window === "undefined") return {};

  try {
    const versionRaw = window.localStorage.getItem(CACHE_VERSION_KEY);
    if (!versionRaw || Number(versionRaw) !== CURRENT_VERSION) {
      return {};
    }

    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    return parsed as MaxWeightsMap;
  } catch {
    return {};
  }
}

/** 最大重量キャッシュを保存 */
export function saveMaxWeightsCache(maxWeights: MaxWeightsMap): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(maxWeights));
    window.localStorage.setItem(CACHE_VERSION_KEY, String(CURRENT_VERSION));
  } catch {
    /* noop */
  }
}

/** localStorage をスキャンして最大重量を計算（重い処理） */
export function calculateMaxWeightsFromStorage(): MaxWeightsMap {
  if (typeof window === "undefined") return {};

  const result: MaxWeightsMap = {};

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key) continue;

    if (!key.startsWith("workout_") && !key.startsWith("cardio_")) continue;

    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as {
        exerciseId?: string;
        weight?: number;
        sets?: { weight?: number }[];
      };

      const exerciseId = parsed.exerciseId;
      if (!exerciseId) continue;

      const weights: number[] = [];

      if (typeof parsed.weight === "number") {
        weights.push(parsed.weight);
      }

      if (Array.isArray(parsed.sets)) {
        parsed.sets.forEach((set) => {
          if (typeof set.weight === "number") {
            weights.push(set.weight);
          }
        });
      }

      if (weights.length === 0) continue;

      const max = Math.max(...weights);
      result[exerciseId] = Math.max(result[exerciseId] ?? 0, max);
    } catch {
      continue;
    }
  }

  return result;
}
