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
