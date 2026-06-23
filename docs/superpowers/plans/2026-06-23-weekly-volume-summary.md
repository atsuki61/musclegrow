# 週間ボリュームサマリー Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ホーム画面に「今週（月〜日）のトレーニングサマリー」カード（ジム回数 / 総ボリューム / 総セット / 先週比）を追加する。

**Architecture:** 純粋関数（週範囲・集計組み立て・マージ）を `lib/utils/weekly-summary.ts` に集約し、DB集計（SQL）とゲスト集計（localStorage走査）の二系統がこれを共有する。サーバーコンポーネントがDB集計を初期 prop として渡し、クライアントの `WeeklySummaryCard` が `shouldUseDbOnly()` に応じて localStorage 集計をマージする（既存 `big3-progress.tsx` と同方式）。

**Tech Stack:** Next.js(App Router) / TypeScript / Drizzle ORM(Postgres) / date-fns / Vitest / Testing Library / Tailwind / lucide-react

## Global Constraints

- パッケージマネージャは **pnpm**。テストは `pnpm test:run`、lint は `pnpm lint`、ビルドは `pnpm build`。
- 単体テストは **Vitest**。既存に倣い **Given/When/Then** コメント、日付固定は `vi.setSystemTime`。
- 週境界は **`Asia/Tokyo`** 基準・**月曜起点**（`weekStartsOn: 1`）。日付は **`yyyy-MM-dd` 文字列**で扱いタイムゾーン事故を回避。
- 有効セット条件は全系統で同一: **`NOT isWarmup AND weight > 0 AND reps > 0`**。
- 総ボリューム = `Σ(weight × reps)`、総セット = 有効セット件数、ジム回数 = 有効セットのある distinct 日数。
- 先週ボリュームが 0 のとき先週比は `null`（UI は「NEW」）。ゼロ除算しない。
- 曜日ラベルは日本語 **「月火水木金土日」**。
- DB の `sets.weight` は `numeric`。SQL集計では `(${sets.weight}::numeric)` で明示キャストし `::float` で返す（既存 `stats.ts` 準拠）。
- 本集計は `unstable_cache` を使わない（ホーム表示の即時性優先）。
- 既存ファイルパス: `src/lib/`、テストは `src/__tests__/` 配下にミラー配置。

---

### Task 1: 純粋ユーティリティ `weekly-summary.ts`

週範囲算出・集計組み立て・先週比・マージ・空サマリーを提供する純粋関数群。DB/ゲスト両系統が共有する土台。

**Files:**
- Create: `src/lib/utils/weekly-summary.ts`
- Test: `src/__tests__/lib/utils/weekly-summary.test.ts`

**Interfaces:**
- Consumes: `date-fns`（`startOfWeek` / `endOfWeek` / `subWeeks` / `format` / `parseISO` / `differenceInCalendarDays` / `getDay`）
- Produces:
  - `interface WeekRange { weekStart: string; weekEnd: string; prevWeekStart: string; prevWeekEnd: string }`
  - `interface DailyVolume { date: string; volume: number; setCount: number }`
  - `interface WeeklySummary { weekStart: string; weekEnd: string; trainedDays: boolean[]; gymCount: number; totalVolume: number; totalSets: number; prevWeekVolume: number }`
  - `getWeekRange(now?: Date): WeekRange`
  - `getJstWeekdayIndex(now?: Date): number`（0=月 … 6=日）
  - `calcVolumeDelta(current: number, prev: number): number | null`
  - `buildWeeklySummary(weekDays: DailyVolume[], prevWeekVolume: number, range: WeekRange): WeeklySummary`
  - `mergeWeeklySummary(a: WeeklySummary, b: WeeklySummary): WeeklySummary`
  - `emptyWeeklySummary(range: WeekRange): WeeklySummary`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/__tests__/lib/utils/weekly-summary.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getWeekRange,
  getJstWeekdayIndex,
  calcVolumeDelta,
  buildWeeklySummary,
  mergeWeeklySummary,
  emptyWeeklySummary,
  type WeekRange,
} from "@/lib/utils/weekly-summary";

// 2024-01-17 はJSTで水曜日
const range2024w3: WeekRange = {
  weekStart: "2024-01-15",
  weekEnd: "2024-01-21",
  prevWeekStart: "2024-01-08",
  prevWeekEnd: "2024-01-14",
};

describe("getWeekRange", () => {
  beforeEach(() => vi.setSystemTime(new Date("2024-01-17T03:00:00Z"))); // JST 12:00 水
  afterEach(() => vi.useRealTimers());

  it("月曜起点で今週・先週の範囲を返す", () => {
    // When
    const r = getWeekRange();
    // Then
    expect(r).toEqual(range2024w3);
  });

  it("UTC日曜深夜でもJSTで月曜に繰り上がる", () => {
    // Given: 2024-01-21 15:30 UTC = 2024-01-22 00:30 JST(月)
    vi.setSystemTime(new Date("2024-01-21T15:30:00Z"));
    // When
    const r = getWeekRange();
    // Then: 翌週(月)に入る
    expect(r.weekStart).toBe("2024-01-22");
    expect(r.weekEnd).toBe("2024-01-28");
  });
});

describe("getJstWeekdayIndex", () => {
  afterEach(() => vi.useRealTimers());
  it("水曜は2を返す（月=0基準）", () => {
    vi.setSystemTime(new Date("2024-01-17T03:00:00Z"));
    expect(getJstWeekdayIndex()).toBe(2);
  });
  it("日曜は6を返す", () => {
    vi.setSystemTime(new Date("2024-01-21T03:00:00Z"));
    expect(getJstWeekdayIndex()).toBe(6);
  });
});

describe("calcVolumeDelta", () => {
  it("先週比%を返す", () => {
    expect(calcVolumeDelta(110, 100)).toBeCloseTo(10);
  });
  it("先週が0ならnull（ゼロ除算回避）", () => {
    expect(calcVolumeDelta(100, 0)).toBeNull();
  });
  it("減少はマイナス%", () => {
    expect(calcVolumeDelta(80, 100)).toBeCloseTo(-20);
  });
});

describe("buildWeeklySummary", () => {
  it("日別データから合計・曜日ドット・ジム回数を組み立てる", () => {
    // Given: 月(15)と水(17)にトレーニング
    const weekDays = [
      { date: "2024-01-15", volume: 5000, setCount: 20 },
      { date: "2024-01-17", volume: 7500, setCount: 28 },
    ];
    // When
    const s = buildWeeklySummary(weekDays, 11000, range2024w3);
    // Then
    expect(s.totalVolume).toBe(12500);
    expect(s.totalSets).toBe(48);
    expect(s.gymCount).toBe(2);
    expect(s.trainedDays).toEqual([true, false, true, false, false, false, false]);
    expect(s.prevWeekVolume).toBe(11000);
  });

  it("空データなら全て0・全消灯", () => {
    const s = buildWeeklySummary([], 0, range2024w3);
    expect(s.gymCount).toBe(0);
    expect(s.totalVolume).toBe(0);
    expect(s.trainedDays).toEqual([false, false, false, false, false, false, false]);
  });

  it("範囲外の日付はドットに反映しない", () => {
    const s = buildWeeklySummary(
      [{ date: "2024-01-22", volume: 100, setCount: 1 }],
      0,
      range2024w3
    );
    expect(s.trainedDays.every((d) => d === false)).toBe(true);
  });
});

describe("mergeWeeklySummary", () => {
  it("volume/setは加算、trainedDaysはOR、gymCountは再計算", () => {
    // Given: DB(月のみ) と local(水のみ)
    const dbS = buildWeeklySummary(
      [{ date: "2024-01-15", volume: 5000, setCount: 20 }],
      3000,
      range2024w3
    );
    const localS = buildWeeklySummary(
      [{ date: "2024-01-17", volume: 7500, setCount: 28 }],
      8000,
      range2024w3
    );
    // When
    const m = mergeWeeklySummary(dbS, localS);
    // Then
    expect(m.totalVolume).toBe(12500);
    expect(m.totalSets).toBe(48);
    expect(m.gymCount).toBe(2);
    expect(m.trainedDays).toEqual([true, false, true, false, false, false, false]);
    expect(m.prevWeekVolume).toBe(11000);
  });

  it("同日重複はgymCountを二重計上しない", () => {
    const a = buildWeeklySummary(
      [{ date: "2024-01-15", volume: 5000, setCount: 20 }],
      0,
      range2024w3
    );
    const b = buildWeeklySummary(
      [{ date: "2024-01-15", volume: 1000, setCount: 4 }],
      0,
      range2024w3
    );
    const m = mergeWeeklySummary(a, b);
    expect(m.gymCount).toBe(1);
    expect(m.totalVolume).toBe(6000);
  });
});

describe("emptyWeeklySummary", () => {
  it("範囲だけ持つゼロサマリーを返す", () => {
    const s = emptyWeeklySummary(range2024w3);
    expect(s.weekStart).toBe("2024-01-15");
    expect(s.gymCount).toBe(0);
    expect(s.totalVolume).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test:run src/__tests__/lib/utils/weekly-summary.test.ts`
Expected: FAIL（`weekly-summary` モジュール未作成で解決エラー）

- [ ] **Step 3: 実装を書く**

Create `src/lib/utils/weekly-summary.ts`:

```ts
/**
 * 週間ボリュームサマリー用の純粋ユーティリティ
 * DB集計・localStorage集計の両系統が共有する
 */

import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  format,
  parseISO,
  differenceInCalendarDays,
  getDay,
} from "date-fns";

export interface WeekRange {
  weekStart: string; // yyyy-MM-dd（月曜）
  weekEnd: string; // yyyy-MM-dd（日曜）
  prevWeekStart: string;
  prevWeekEnd: string;
}

export interface DailyVolume {
  date: string; // yyyy-MM-dd
  volume: number; // その日の Σ(weight*reps)（有効セット）
  setCount: number; // その日の有効セット件数
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  trainedDays: boolean[]; // 月→日の7要素
  gymCount: number;
  totalVolume: number;
  totalSets: number;
  prevWeekVolume: number;
}

// 現在時刻をJSTの暦日 yyyy-MM-dd に変換（実行環境TZに依存しない）
function jstDateParts(now: Date): { y: number; m: number; d: number } {
  const str = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = str.split("-").map(Number);
  return { y, m, d };
}

export function getWeekRange(now: Date = new Date()): WeekRange {
  const { y, m, d } = jstDateParts(now);
  const base = new Date(y, m - 1, d);
  const ws = startOfWeek(base, { weekStartsOn: 1 });
  const we = endOfWeek(base, { weekStartsOn: 1 });
  return {
    weekStart: format(ws, "yyyy-MM-dd"),
    weekEnd: format(we, "yyyy-MM-dd"),
    prevWeekStart: format(subWeeks(ws, 1), "yyyy-MM-dd"),
    prevWeekEnd: format(subWeeks(we, 1), "yyyy-MM-dd"),
  };
}

export function getJstWeekdayIndex(now: Date = new Date()): number {
  const { y, m, d } = jstDateParts(now);
  // getDay: 0=日..6=土 → 月=0..日=6 に変換
  return (getDay(new Date(y, m - 1, d)) + 6) % 7;
}

export function calcVolumeDelta(current: number, prev: number): number | null {
  if (!prev || prev <= 0) return null;
  return ((current - prev) / prev) * 100;
}

export function buildWeeklySummary(
  weekDays: DailyVolume[],
  prevWeekVolume: number,
  range: WeekRange
): WeeklySummary {
  const trainedDays = [false, false, false, false, false, false, false];
  let totalVolume = 0;
  let totalSets = 0;
  const start = parseISO(range.weekStart);

  for (const day of weekDays) {
    totalVolume += day.volume;
    totalSets += day.setCount;
    const idx = differenceInCalendarDays(parseISO(day.date), start);
    if (idx >= 0 && idx < 7) {
      trainedDays[idx] = true;
    }
  }

  return {
    weekStart: range.weekStart,
    weekEnd: range.weekEnd,
    trainedDays,
    gymCount: trainedDays.filter(Boolean).length,
    totalVolume,
    totalSets,
    prevWeekVolume,
  };
}

export function mergeWeeklySummary(
  a: WeeklySummary,
  b: WeeklySummary
): WeeklySummary {
  const trainedDays = a.trainedDays.map((v, i) => v || b.trainedDays[i]);
  return {
    weekStart: a.weekStart,
    weekEnd: a.weekEnd,
    trainedDays,
    gymCount: trainedDays.filter(Boolean).length,
    totalVolume: a.totalVolume + b.totalVolume,
    totalSets: a.totalSets + b.totalSets,
    prevWeekVolume: a.prevWeekVolume + b.prevWeekVolume,
  };
}

export function emptyWeeklySummary(range: WeekRange): WeeklySummary {
  return buildWeeklySummary([], 0, range);
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test:run src/__tests__/lib/utils/weekly-summary.test.ts`
Expected: PASS（全テスト緑）

- [ ] **Step 5: コミット**

```bash
git add src/lib/utils/weekly-summary.ts src/__tests__/lib/utils/weekly-summary.test.ts
git commit -m "feat: 週間サマリー純粋ユーティリティを追加"
```

---

### Task 2: ゲスト集計 `local-storage-weekly-summary.ts`

localStorage の `workout_*` キーを走査し、今週/先週の集計を `WeeklySummary` に組み立てる。

**Files:**
- Create: `src/lib/local-storage-weekly-summary.ts`
- Test: `src/__tests__/lib/local-storage-weekly-summary.test.ts`

**Interfaces:**
- Consumes: `parseStorageKey`（`@/lib/local-storage-history`）、`buildWeeklySummary` / `WeekRange` / `WeeklySummary` / `DailyVolume`（Task 1）、`SetRecord`（`@/types/workout`）
- Produces: `getWeeklySummaryFromStorage(range: WeekRange): WeeklySummary`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/__tests__/lib/local-storage-weekly-summary.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { getWeeklySummaryFromStorage } from "@/lib/local-storage-weekly-summary";
import type { WeekRange } from "@/lib/utils/weekly-summary";

const range: WeekRange = {
  weekStart: "2024-01-15",
  weekEnd: "2024-01-21",
  prevWeekStart: "2024-01-08",
  prevWeekEnd: "2024-01-14",
};

function setWorkout(date: string, exerciseId: string, sets: unknown) {
  localStorage.setItem(`workout_${date}_${exerciseId}`, JSON.stringify(sets));
}

describe("getWeeklySummaryFromStorage", () => {
  beforeEach(() => localStorage.clear());

  it("今週の有効セットからボリューム・セット・ジム回数を集計する", () => {
    // Given: 月(15)に2セット、水(17)に1セット
    setWorkout("2024-01-15", "ex1", [
      { id: "a", setOrder: 1, weight: 100, reps: 10, isWarmup: false },
      { id: "b", setOrder: 2, weight: 100, reps: 8, isWarmup: false },
    ]);
    setWorkout("2024-01-17", "ex2", [
      { id: "c", setOrder: 1, weight: 50, reps: 12, isWarmup: false },
    ]);
    // When
    const s = getWeeklySummaryFromStorage(range);
    // Then: 100*10 + 100*8 + 50*12 = 2400
    expect(s.totalVolume).toBe(2400);
    expect(s.totalSets).toBe(3);
    expect(s.gymCount).toBe(2);
    expect(s.trainedDays).toEqual([true, false, true, false, false, false, false]);
  });

  it("ウォームアップ・無効値・回数0を除外する", () => {
    setWorkout("2024-01-15", "ex1", [
      { id: "a", setOrder: 1, weight: 60, reps: 10, isWarmup: true }, // 除外
      { id: "b", setOrder: 2, weight: 0, reps: 10, isWarmup: false }, // 除外
      { id: "c", setOrder: 3, weight: 100, reps: 0, isWarmup: false }, // 除外
      { id: "d", setOrder: 4, weight: 100, reps: 5, isWarmup: false }, // 有効
    ]);
    const s = getWeeklySummaryFromStorage(range);
    expect(s.totalVolume).toBe(500);
    expect(s.totalSets).toBe(1);
  });

  it("先週分はprevWeekVolumeに加算され今週指標には含めない", () => {
    setWorkout("2024-01-10", "ex1", [
      { id: "a", setOrder: 1, weight: 100, reps: 10, isWarmup: false },
    ]);
    const s = getWeeklySummaryFromStorage(range);
    expect(s.prevWeekVolume).toBe(1000);
    expect(s.totalVolume).toBe(0);
    expect(s.gymCount).toBe(0);
  });

  it("isWarmup未定義は通常セット扱い、weightが数値文字列も集計する", () => {
    setWorkout("2024-01-16", "ex1", [
      { id: "a", setOrder: 1, weight: "80", reps: 10 }, // isWarmup無し・文字列weight
    ]);
    const s = getWeeklySummaryFromStorage(range);
    expect(s.totalVolume).toBe(800);
    expect(s.totalSets).toBe(1);
  });

  it("同日に複数種目キーがあっても1日として数える", () => {
    setWorkout("2024-01-15", "ex1", [
      { id: "a", setOrder: 1, weight: 100, reps: 10, isWarmup: false },
    ]);
    setWorkout("2024-01-15", "ex2", [
      { id: "b", setOrder: 1, weight: 50, reps: 10, isWarmup: false },
    ]);
    const s = getWeeklySummaryFromStorage(range);
    expect(s.gymCount).toBe(1);
    expect(s.totalVolume).toBe(1500);
    expect(s.totalSets).toBe(2);
  });

  it("破損JSON・非配列はスキップする", () => {
    localStorage.setItem("workout_2024-01-15_ex1", "{not json");
    localStorage.setItem("workout_2024-01-16_ex2", JSON.stringify({ a: 1 }));
    const s = getWeeklySummaryFromStorage(range);
    expect(s.totalVolume).toBe(0);
    expect(s.gymCount).toBe(0);
  });

  it("cardio_ キーや範囲外は無視する", () => {
    localStorage.setItem(
      "cardio_2024-01-15_ex1",
      JSON.stringify([{ duration: 30 }])
    );
    setWorkout("2024-02-01", "ex1", [
      { id: "a", setOrder: 1, weight: 100, reps: 10, isWarmup: false },
    ]);
    const s = getWeeklySummaryFromStorage(range);
    expect(s.totalVolume).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test:run src/__tests__/lib/local-storage-weekly-summary.test.ts`
Expected: FAIL（モジュール未作成）

- [ ] **Step 3: 実装を書く**

Create `src/lib/local-storage-weekly-summary.ts`:

```ts
"use client";

import { parseStorageKey } from "./local-storage-history";
import {
  buildWeeklySummary,
  type WeekRange,
  type WeeklySummary,
  type DailyVolume,
} from "./utils/weekly-summary";
import type { SetRecord } from "@/types/workout";

/**
 * localStorage の workout_* 記録から週間サマリーを集計する（ゲスト用）
 * 有効セット条件: NOT isWarmup AND weight>0 AND reps>0（DB系と同一）
 */
export function getWeeklySummaryFromStorage(range: WeekRange): WeeklySummary {
  if (typeof window === "undefined") {
    return buildWeeklySummary([], 0, range);
  }

  const weekByDate = new Map<string, DailyVolume>();
  let prevWeekVolume = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const info = parseStorageKey(key);
      if (!info || info.type !== "workout") continue;

      const inThisWeek =
        info.dateStr >= range.weekStart && info.dateStr <= range.weekEnd;
      const inPrevWeek =
        info.dateStr >= range.prevWeekStart &&
        info.dateStr <= range.prevWeekEnd;
      if (!inThisWeek && !inPrevWeek) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;
      const sets = parsed as SetRecord[];

      let dayVolume = 0;
      let dayCount = 0;
      for (const set of sets) {
        if (set.isWarmup) continue;
        const weight =
          typeof set.weight === "number" ? set.weight : Number(set.weight);
        if (!Number.isFinite(weight) || weight <= 0) continue;
        if (!set.reps || set.reps <= 0) continue;
        dayVolume += weight * set.reps;
        dayCount += 1;
      }
      if (dayCount === 0) continue;

      if (inThisWeek) {
        const entry =
          weekByDate.get(info.dateStr) ??
          ({ date: info.dateStr, volume: 0, setCount: 0 } as DailyVolume);
        entry.volume += dayVolume;
        entry.setCount += dayCount;
        weekByDate.set(info.dateStr, entry);
      } else {
        prevWeekVolume += dayVolume;
      }
    }
  } catch (error) {
    console.warn("週間サマリーのローカル集計に失敗:", error);
  }

  return buildWeeklySummary(
    Array.from(weekByDate.values()),
    prevWeekVolume,
    range
  );
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test:run src/__tests__/lib/local-storage-weekly-summary.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/local-storage-weekly-summary.ts src/__tests__/lib/local-storage-weekly-summary.test.ts
git commit -m "feat: ゲスト用の週間サマリーlocalStorage集計を追加"
```

---

### Task 3: DBアクション `getWeeklySummary`

ログインユーザー向けに Postgres でSQL集計し `WeeklySummary` を返すサーバーアクション。

**Files:**
- Create: `src/lib/actions/weekly-summary.ts`
- Test: `src/__tests__/lib/actions/weekly-summary.test.ts`

**Interfaces:**
- Consumes: `db`（`../../../db`）、`sets` / `workoutSessions`（`../../../db/schemas/app`）、`eq` / `and` / `gte` / `lte` / `sql`（`drizzle-orm`）、`getWeekRange` / `buildWeeklySummary` / `emptyWeeklySummary` / `WeeklySummary`（Task 1）
- Produces: `getWeeklySummary(userId: string, now?: Date): Promise<WeeklySummary>`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/__tests__/lib/actions/weekly-summary.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../../db", () => ({
  db: { select: vi.fn() },
}));

import { getWeeklySummary } from "@/lib/actions/weekly-summary";
import { db } from "../../../../db";

// 今週(GROUP BY date)→prev(SUM) の順で db.select が2回呼ばれる
function mockTwoQueries(weekRows: unknown[], prevRows: unknown[]) {
  let call = 0;
  (db.select as any) = vi.fn(() => {
    call++;
    if (call === 1) {
      return {
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              groupBy: vi.fn(() => Promise.resolve(weekRows)),
            })),
          })),
        })),
      };
    }
    return {
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(prevRows)),
        })),
      })),
    };
  });
}

describe("getWeeklySummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2024-01-17T03:00:00Z")); // JST 水
  });

  it("今週の日別集計と先週合計からサマリーを返す", async () => {
    // Given: 月(15)と水(17)に記録、先週合計11000
    mockTwoQueries(
      [
        { date: "2024-01-15", volume: 5000, setCount: 20 },
        { date: "2024-01-17", volume: 7500, setCount: 28 },
      ],
      [{ volume: 11000 }]
    );
    // When
    const s = await getWeeklySummary("user1");
    // Then
    expect(s.totalVolume).toBe(12500);
    expect(s.totalSets).toBe(48);
    expect(s.gymCount).toBe(2);
    expect(s.trainedDays).toEqual([true, false, true, false, false, false, false]);
    expect(s.prevWeekVolume).toBe(11000);
  });

  it("記録なしなら全て0、先週SUMがnullでも0扱い", async () => {
    mockTwoQueries([], [{ volume: null }]);
    const s = await getWeeklySummary("user1");
    expect(s.totalVolume).toBe(0);
    expect(s.gymCount).toBe(0);
    expect(s.prevWeekVolume).toBe(0);
  });

  it("DBエラー時は安全に空サマリーを返す", async () => {
    (db.select as any) = vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            groupBy: vi.fn(() => Promise.reject(new Error("db error"))),
          })),
        })),
      })),
    }));
    const s = await getWeeklySummary("user1");
    expect(s.totalVolume).toBe(0);
    expect(s.weekStart).toBe("2024-01-15");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test:run src/__tests__/lib/actions/weekly-summary.test.ts`
Expected: FAIL（モジュール未作成）

- [ ] **Step 3: 実装を書く**

Create `src/lib/actions/weekly-summary.ts`:

```ts
"use server";

import { db } from "../../../db";
import { sets, workoutSessions } from "../../../db/schemas/app";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import {
  getWeekRange,
  buildWeeklySummary,
  emptyWeeklySummary,
  type DailyVolume,
  type WeeklySummary,
} from "@/lib/utils/weekly-summary";

// 有効セット条件（DB/ゲストで同一）: NOT isWarmup AND weight>0 AND reps>0
const validSet = sql`${sets.isWarmup} = false AND ${sets.weight} > 0 AND ${sets.reps} > 0`;
const volumeExpr = sql<number>`COALESCE(SUM((${sets.weight}::numeric) * ${sets.reps}), 0)::float`;

/**
 * 今週（月〜日, JST）の週間サマリーをDBから集計する
 */
export async function getWeeklySummary(
  userId: string,
  now: Date = new Date()
): Promise<WeeklySummary> {
  const range = getWeekRange(now);

  try {
    // 今週: 日別集計
    const weekRows = await db
      .select({
        date: workoutSessions.date,
        volume: volumeExpr,
        setCount: sql<number>`COUNT(*)::int`,
      })
      .from(sets)
      .innerJoin(workoutSessions, eq(sets.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          validSet,
          gte(workoutSessions.date, range.weekStart),
          lte(workoutSessions.date, range.weekEnd)
        )
      )
      .groupBy(workoutSessions.date);

    // 先週: 合計のみ
    const prevRows = await db
      .select({ volume: volumeExpr })
      .from(sets)
      .innerJoin(workoutSessions, eq(sets.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          validSet,
          gte(workoutSessions.date, range.prevWeekStart),
          lte(workoutSessions.date, range.prevWeekEnd)
        )
      );

    const weekDays: DailyVolume[] = weekRows.map((r) => ({
      date: r.date,
      volume: Number(r.volume) || 0,
      setCount: Number(r.setCount) || 0,
    }));
    const prevWeekVolume = Number(prevRows[0]?.volume) || 0;

    return buildWeeklySummary(weekDays, prevWeekVolume, range);
  } catch (error) {
    console.error("週間サマリーの取得に失敗しました:", error);
    return emptyWeeklySummary(range);
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test:run src/__tests__/lib/actions/weekly-summary.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/actions/weekly-summary.ts src/__tests__/lib/actions/weekly-summary.test.ts
git commit -m "feat: 週間サマリーDB集計アクションを追加"
```

---

### Task 4: UIコンポーネント `WeeklySummaryCard`

Pattern C（曜日ドット + 3指標）のクライアントカード。初期DB値で描画し、ゲスト/移行未完了時は localStorage 集計をマージ。

**Files:**
- Create: `src/components/features/home/weekly-summary-card.tsx`
- Test: `src/__tests__/components/home/weekly-summary-card.test.tsx`

**Interfaces:**
- Consumes: `useAuthSession`（`@/lib/auth-session-context`）、`shouldUseDbOnly`（`@/lib/data-source`）、`getWeeklySummaryFromStorage`（Task 2）、`getWeekRange` / `getJstWeekdayIndex` / `calcVolumeDelta` / `mergeWeeklySummary` / `WeeklySummary`（Task 1）、`lucide-react`
- Produces: `WeeklySummaryCard({ initial }: { initial: WeeklySummary }): JSX.Element`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/__tests__/components/home/weekly-summary-card.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklySummaryCard } from "@/components/features/home/weekly-summary-card";
import type { WeeklySummary } from "@/lib/utils/weekly-summary";

vi.mock("@/lib/auth-session-context", () => ({
  useAuthSession: () => ({ userId: "user1" }),
}));

// ログイン+移行完了=DBのみ（localStorageマージしない）
vi.mock("@/lib/data-source", () => ({
  shouldUseDbOnly: () => true,
}));

vi.mock("@/lib/local-storage-weekly-summary", () => ({
  getWeeklySummaryFromStorage: vi.fn(),
}));

function makeSummary(over: Partial<WeeklySummary> = {}): WeeklySummary {
  return {
    weekStart: "2024-01-15",
    weekEnd: "2024-01-21",
    trainedDays: [true, false, true, false, false, false, false],
    gymCount: 2,
    totalVolume: 12500,
    totalSets: 48,
    prevWeekVolume: 11000,
    ...over,
  };
}

describe("WeeklySummaryCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("総ボリューム・総セットを桁区切りで表示する", () => {
    // When
    render(<WeeklySummaryCard initial={makeSummary()} />);
    // Then
    expect(screen.getByText("12,500")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("先週比%を表示する（増加）", () => {
    render(<WeeklySummaryCard initial={makeSummary()} />);
    // (12500-11000)/11000 ≈ +14%
    expect(screen.getByText("+14%")).toBeInTheDocument();
  });

  it("先週が0ならNEWを表示する", () => {
    render(
      <WeeklySummaryCard initial={makeSummary({ prevWeekVolume: 0 })} />
    );
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("記録ゼロのとき空メッセージを表示する", () => {
    render(
      <WeeklySummaryCard
        initial={makeSummary({
          trainedDays: [false, false, false, false, false, false, false],
          gymCount: 0,
          totalVolume: 0,
          totalSets: 0,
          prevWeekVolume: 0,
        })}
      />
    );
    expect(screen.getByText("今週はまだ記録がありません")).toBeInTheDocument();
  });

  it("曜日ラベルを月〜日で表示する", () => {
    render(<WeeklySummaryCard initial={makeSummary()} />);
    ["月", "火", "水", "木", "金", "土", "日"].forEach((d) =>
      expect(screen.getByText(d)).toBeInTheDocument()
    );
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test:run src/__tests__/components/home/weekly-summary-card.test.tsx`
Expected: FAIL（コンポーネント未作成）

- [ ] **Step 3: 実装を書く**

Create `src/components/features/home/weekly-summary-card.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";
import { useAuthSession } from "@/lib/auth-session-context";
import { shouldUseDbOnly } from "@/lib/data-source";
import { getWeeklySummaryFromStorage } from "@/lib/local-storage-weekly-summary";
import {
  getWeekRange,
  getJstWeekdayIndex,
  calcVolumeDelta,
  mergeWeeklySummary,
  type WeeklySummary,
} from "@/lib/utils/weekly-summary";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

interface WeeklySummaryCardProps {
  initial: WeeklySummary;
}

export function WeeklySummaryCard({ initial }: WeeklySummaryCardProps) {
  const { userId } = useAuthSession();
  const [summary, setSummary] = useState<WeeklySummary>(initial);
  const todayIndex = getJstWeekdayIndex();

  const recompute = useCallback(() => {
    // ログイン+移行完了ならDB初期値をそのまま使う
    if (shouldUseDbOnly(userId)) {
      setSummary(initial);
      return;
    }
    // ゲスト or 移行未完了: localStorage集計をマージ
    const task = () => {
      const local = getWeeklySummaryFromStorage(getWeekRange());
      setSummary(mergeWeeklySummary(initial, local));
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(task);
    } else {
      setTimeout(task, 1);
    }
  }, [userId, initial]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    const handler = () => recompute();
    window.addEventListener("workout-record-updated", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("workout-record-updated", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [recompute]);

  const delta = calcVolumeDelta(summary.totalVolume, summary.prevWeekVolume);
  const hasData = summary.gymCount > 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-bold text-xs tracking-wider text-muted-foreground flex items-center gap-1.5 uppercase">
          <Flame className="w-4 h-4 text-primary fill-primary" />
          This Week
        </h2>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />

        {/* 曜日ドット */}
        <div className="flex justify-between mb-4">
          {WEEKDAY_LABELS.map((label, i) => {
            const done = summary.trainedDays[i];
            const isToday = i === todayIndex;
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <span
                  className={`text-[10px] font-bold ${
                    isToday ? "text-primary" : "text-muted-foreground/60"
                  }`}
                >
                  {label}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    done
                      ? "bg-linear-to-br from-primary to-orange-600 text-white shadow-lg shadow-primary/25 scale-105"
                      : "bg-muted/50 text-muted-foreground/20"
                  } ${
                    isToday && !done
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : ""
                  }`}
                >
                  {done ? "✓" : ""}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3指標 */}
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div>
            <div className="text-lg font-black tabular-nums leading-none">
              {summary.totalVolume.toLocaleString()}
              <span className="text-[11px] font-bold text-muted-foreground">
                {" "}
                kg
              </span>
            </div>
            <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground mt-1">
              総ボリューム
            </div>
          </div>

          <div>
            <div className="text-lg font-black tabular-nums leading-none">
              {summary.totalSets}
            </div>
            <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground mt-1">
              総セット
            </div>
          </div>

          <div>
            {delta === null ? (
              <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                NEW
              </span>
            ) : (
              <span
                className={`text-xs font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                  delta >= 0
                    ? "text-green-600 bg-green-500/10"
                    : "text-red-600 bg-red-500/10"
                }`}
              >
                {delta >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {delta >= 0 ? "+" : ""}
                {Math.round(delta)}%
              </span>
            )}
            <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground mt-1.5">
              先週比
            </div>
          </div>
        </div>

        {!hasData && (
          <p className="text-center text-[11px] text-muted-foreground mt-3">
            今週はまだ記録がありません
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test:run src/__tests__/components/home/weekly-summary-card.test.tsx`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/components/features/home/weekly-summary-card.tsx src/__tests__/components/home/weekly-summary-card.test.tsx
git commit -m "feat: 週間サマリーカードUIを追加"
```

---

### Task 5: ホームへの配線と旧コンポーネント削除

サーバーでDB集計→prop、ホームにカード配置、未使用の `weekly-streak` を削除。

**Files:**
- Modify: `src/app/(app)/page.tsx`
- Modify: `src/components/features/home/home-page.tsx`
- Delete: `src/components/features/home/weekly-streak.tsx`
- Delete: `src/__tests__/components/home/weekly-streak.test.tsx`

**Interfaces:**
- Consumes: `getWeeklySummary`（Task 3）、`getWeekRange` / `emptyWeeklySummary` / `WeeklySummary`（Task 1）、`WeeklySummaryCard`（Task 4）
- Produces: `HomePage` が `weeklySummary: WeeklySummary` prop を受け取る

- [ ] **Step 1: 旧コンポーネントと不要テストを削除**

```bash
git rm src/components/features/home/weekly-streak.tsx src/__tests__/components/home/weekly-streak.test.tsx
```

- [ ] **Step 2: `home-page.tsx` を編集**

`src/components/features/home/home-page.tsx` の import に追加（ファイル冒頭の import 群、`RecordButton` import の下）:

```tsx
import { WeeklySummaryCard } from "./weekly-summary-card";
```

`WeeklySummary` 型の import を追加（既存 `@/lib/big3` の import の下）:

```tsx
import type { WeeklySummary } from "@/lib/utils/weekly-summary";
```

`HomePageProps` に `weeklySummary` を追加:

```tsx
interface HomePageProps {
  dbWeights: Big3Weights;
  targets: Big3Targets;
  exerciseIds: {
    benchPress?: string;
    squat?: string;
    deadlift?: string;
  };
  totalDays: number;
  isLoggedIn: boolean;
  userName?: string | null;
  weeklySummary: WeeklySummary;
}
```

関数シグネチャの分割代入に `weeklySummary` を追加:

```tsx
export function HomePage({
  dbWeights,
  targets,
  exerciseIds,
  totalDays,
  isLoggedIn,
  userName,
  weeklySummary,
}: HomePageProps) {
```

JSX の `<Big3Progress ... />` と `<RecordButton />` の間にカードを挿入:

```tsx
      <Big3Progress
        benchPress={big3Data.benchPress}
        squat={big3Data.squat}
        deadlift={big3Data.deadlift}
      />
      <WeeklySummaryCard initial={weeklySummary} />
      <RecordButton />
```

- [ ] **Step 3: `page.tsx` を編集**

`src/app/(app)/page.tsx` の import に追加（`getTotalWorkoutDays` import の下）:

```tsx
import { getWeeklySummary } from "@/lib/actions/weekly-summary";
import { getWeekRange, emptyWeeklySummary } from "@/lib/utils/weekly-summary";
```

`Promise.all` の配列に週間サマリー取得を追加し、分割代入も更新:

```tsx
  // 並列でデータを取得
  const [big3Result, targetsResult, totalDays, exercisesResult, weeklySummary] =
    await Promise.all([
      getBig3MaxWeights(userId),
      getBig3TargetValues(userId),
      userId ? getTotalWorkoutDays(userId) : Promise.resolve(0),
      getExercises(userId),
      userId
        ? getWeeklySummary(userId)
        : Promise.resolve(emptyWeeklySummary(getWeekRange())),
    ]);
```

`<HomePage ... />` に prop を追加:

```tsx
    <HomePage
      dbWeights={dbWeights}
      targets={targets}
      exerciseIds={exerciseIds}
      totalDays={totalDays}
      isLoggedIn={!!userId}
      userName={session?.user?.name}
      weeklySummary={weeklySummary}
    />
```

- [ ] **Step 4: 型チェック・lint・全テスト**

Run: `pnpm lint && pnpm test:run`
Expected: lint エラーなし、全テスト PASS（`weekly-streak.test.tsx` 削除済みで参照エラーが出ないこと）

- [ ] **Step 5: ビルド確認**

Run: `pnpm build`
Expected: ビルド成功（型エラーなし）

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "feat: ホームに週間ボリュームサマリーカードを配置し旧weekly-streakを削除"
```

---

## 動作確認（手動）

1. `pnpm dev` で起動し `http://localhost:4000` を開く。
2. **ゲスト**で記録ページから今週の日付に数セット記録 → ホームに戻り、ジム回数・総ボリューム・総セットが反映されること、曜日ドットが点灯することを確認。
3. 先週分を記録すると先週比%が出る／先週分が無いと「NEW」になることを確認。
4. ライト/ダーク、テーマカラー変更で配色が追従することを確認。
5. ログインユーザーでも同様に表示されることを確認（移行完了済みはDB値、未完了はマージ）。

## Self-Review チェック結果

- **Spec coverage:** 採用デザイン(Pattern C/§3)=Task4、SQL集計(§4.1)=Task3、ゲスト集計(§4.2)=Task2、週境界TZ(§7.1)=Task1、マージ方針(§4.4)=Task1+Task4、集計定義(§7)=Task1〜3、テスト方針(§9)=各Task、配線(§5)=Task5、weekly-streak整理(§4.6)=Task5。受け入れ条件(§10)を手動確認手順でカバー。
- **Placeholder scan:** プレースホルダなし。全ステップに実コード/実コマンド/期待結果を記載。
- **Type consistency:** `WeeklySummary` / `WeekRange` / `DailyVolume` の各プロパティ名と関数シグネチャ（`getWeekRange` / `buildWeeklySummary` / `mergeWeeklySummary` / `emptyWeeklySummary` / `getJstWeekdayIndex` / `calcVolumeDelta` / `getWeeklySummaryFromStorage` / `getWeeklySummary`）を Task 1〜5 で一貫使用。
