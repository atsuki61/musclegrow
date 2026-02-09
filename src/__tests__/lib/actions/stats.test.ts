/**
 * stats.ts のテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// モックの設定
vi.mock("../../../../db", () => ({
  db: {
    select: vi.fn(),
    selectDistinct: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn, // キャッシュをバイパス
}));

// モックした後にインポート
import {
  getProfileHistory,
  getBig3ProgressData,
  getExerciseProgressData,
  getTotalWorkoutDays,
  getRecordedExerciseIds,
} from "@/lib/actions/stats";
import { db } from "../../../../db";

describe("stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfileHistory", () => {
    describe("正常系: 履歴取得", () => {
      it("プロフィール履歴を取得できる", async () => {
        // Given: プロフィール履歴あり
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                {
                  id: "history1",
                  userId: "user1",
                  height: "170",
                  weight: "70",
                  bodyFat: null,
                  muscleMass: null,
                  bmi: "24.2",
                  recordedAt: new Date("2024-01-01"),
                },
              ]),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: プロフィール履歴を取得
        const result = await getProfileHistory("user1", { preset: "month" });

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].weight).toBe(70);
      });

      it("データがない場合、空配列を返す", async () => {
        // Given: データなし
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: プロフィール履歴を取得
        const result = await getProfileHistory("user1", { preset: "year" });

        // Then: 空配列
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: DBエラー
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockRejectedValue(new Error("Database error")),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: プロフィール履歴を取得
        const result = await getProfileHistory("user1");

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("プロフィール履歴の取得に失敗しました");
      });
    });
  });

  describe("getBig3ProgressData", () => {
    describe("正常系: Big3進捗取得", () => {
      it("Big3進捗データを取得できる", async () => {
        // Given: Big3種目とデータあり
        let callCount = 0;
        (db.select as any) = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            // Big3種目取得
            return {
              from: vi.fn(() => ({
                where: vi.fn(() =>
                  Promise.resolve([
                    { id: "bench-press", name: "ベンチプレス" },
                    { id: "squat", name: "スクワット" },
                    { id: "deadlift", name: "デッドリフト" },
                  ])
                ),
              })),
            };
          } else {
            // 最大重量データ取得
            return {
              from: vi.fn(() => ({
                innerJoin: vi.fn(() => ({
                  where: vi.fn(() => ({
                    groupBy: vi.fn(() => ({
                      orderBy: vi.fn(() =>
                        Promise.resolve([
                          { date: "2024-01-01", maxWeight: 100 },
                          { date: "2024-01-15", maxWeight: 110 },
                        ])
                      ),
                    })),
                  })),
                })),
              })),
            };
          }
        });

        // When: Big3進捗データを取得
        const result = await getBig3ProgressData("user1", { preset: "month" });

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.benchPress).toBeDefined();
        expect(result.data?.squat).toBeDefined();
        expect(result.data?.deadlift).toBeDefined();
      });

      it("Big3種目がない場合、空配列を返す", async () => {
        // Given: Big3種目なし
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        });
        (db.select as any) = mockSelect;

        // When: Big3進捗データを取得
        const result = await getBig3ProgressData("user1");

        // Then: 空データ
        expect(result.success).toBe(true);
        expect(result.data?.benchPress).toEqual([]);
        expect(result.data?.squat).toEqual([]);
        expect(result.data?.deadlift).toEqual([]);
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: DBエラー
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(new Error("Database error")),
          }),
        });
        (db.select as any) = mockSelect;

        // When: Big3進捗データを取得
        const result = await getBig3ProgressData("user1");

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("Big3推移データの取得に失敗しました");
      });
    });
  });

  describe("getExerciseProgressData", () => {
    describe("正常系: 種目進捗取得", () => {
      it("種目進捗データを取得できる", async () => {
        // Given: 進捗データあり
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([
                    { date: "2024-01-01", maxWeight: 80 },
                    { date: "2024-01-15", maxWeight: 90 },
                  ]),
                }),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 種目進捗データを取得
        const result = await getExerciseProgressData("user1", {
          exerciseId: "exercise1",
          preset: "month",
        });

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("データがない場合、空配列を返す", async () => {
        // Given: データなし
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 種目進捗データを取得
        const result = await getExerciseProgressData("user1", {
          exerciseId: "exercise1",
        });

        // Then: 空配列
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: DBエラー
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockRejectedValue(new Error("Database error")),
                }),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 種目進捗データを取得
        const result = await getExerciseProgressData("user1", {
          exerciseId: "exercise1",
        });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("種目推移データの取得に失敗しました");
      });
    });
  });

  describe("getTotalWorkoutDays", () => {
    describe("正常系: 日数取得", () => {
      it("トレーニング日数を取得できる", async () => {
        // Given: 日数データあり
        (db.execute as any) = vi.fn().mockResolvedValue([{ count: "15" }]);

        // When: トレーニング日数を取得
        const result = await getTotalWorkoutDays("user1");

        // Then: 成功
        expect(result).toBe(15);
      });

      it("記録がない場合、0を返す", async () => {
        // Given: データなし
        (db.execute as any) = vi.fn().mockResolvedValue([{ count: "0" }]);

        // When: トレーニング日数を取得
        const result = await getTotalWorkoutDays("user1");

        // Then: 0
        expect(result).toBe(0);
      });
    });
  });

  describe("getRecordedExerciseIds", () => {
    describe("正常系: 種目ID取得", () => {
      it("記録済み種目IDを取得できる", async () => {
        // Given: 種目IDあり
        const mockSelectDistinct = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                { exerciseId: "exercise1" },
                { exerciseId: "exercise2" },
              ]),
            }),
          }),
        });
        (db.selectDistinct as any) = mockSelectDistinct;

        // When: 記録済み種目IDを取得
        const result = await getRecordedExerciseIds("user1");

        // Then: 成功
        expect(result).toEqual(["exercise1", "exercise2"]);
      });

      it("記録がない場合、空配列を返す", async () => {
        // Given: データなし
        const mockSelectDistinct = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          }),
        });
        (db.selectDistinct as any) = mockSelectDistinct;

        // When: 記録済み種目IDを取得
        const result = await getRecordedExerciseIds("user1");

        // Then: 空配列
        expect(result).toEqual([]);
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、空配列を返す", async () => {
        // Given: DBエラー
        const mockSelectDistinct = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockRejectedValue(new Error("Database error")),
            }),
          }),
        });
        (db.selectDistinct as any) = mockSelectDistinct;

        // When: 記録済み種目IDを取得
        const result = await getRecordedExerciseIds("user1");

        // Then: 空配列（エラー時のフォールバック）
        expect(result).toEqual([]);
      });
    });
  });
});
