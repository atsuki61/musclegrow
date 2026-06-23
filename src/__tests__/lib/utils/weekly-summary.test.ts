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
    expect(s.totalVolume).toBe(0);
    expect(s.totalSets).toBe(0);
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
