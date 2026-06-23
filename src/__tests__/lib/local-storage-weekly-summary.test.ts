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
