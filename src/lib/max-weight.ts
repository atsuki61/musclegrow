// src/lib/max-weight.ts

export type MaxWeightsMap = Record<string, number>;

const CACHE_KEY = "max_weights_cache_v2";
const CACHE_VERSION_KEY = "max_weights_version_v2";
const CURRENT_VERSION = 2;

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

    const parsed: unknown = JSON.parse(raw);

    // 型ガード: オブジェクトかどうか確認
    if (typeof parsed !== "object" || parsed === null) return {};

    // 値が全て数値であるか簡易チェック（厳密には Record<string, unknown> として扱う）
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

export function calculateMaxWeightsFromStorage(): MaxWeightsMap {
  if (typeof window === "undefined") return {};

  const result: MaxWeightsMap = {};

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key) continue;

    // キーの形式: "workout_YYYY-MM-DD_exerciseId"
    if (!key.startsWith("workout_")) continue;

    // 日付部分(10文字)をスキップしてIDを抽出
    const exerciseId = key.substring(19);
    if (!exerciseId) continue;

    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed: unknown = JSON.parse(raw);

      // 配列であることを確認
      if (!Array.isArray(parsed)) continue;

      const weights: number[] = [];

      parsed.forEach((set: unknown) => {
        // set がオブジェクトであり、nullでないことを確認
        if (typeof set !== "object" || set === null) return;

        // 'weight' プロパティが存在するか確認 (Record<string, unknown> として安全にアクセス)
        const record = set as Record<string, unknown>;

        if ("weight" in record) {
          const val = record.weight;

          if (typeof val === "number") {
            weights.push(val);
          } else if (typeof val === "string") {
            const w = parseFloat(val);
            if (!isNaN(w)) weights.push(w);
          }
        }
      });

      if (weights.length === 0) continue;

      const max = Math.max(...weights);
      result[exerciseId] = Math.max(result[exerciseId] ?? 0, max);
    } catch {
      continue;
    }
  }

  return result;
}
