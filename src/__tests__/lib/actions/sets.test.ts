/**
 * sets.ts のテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SetRecord } from "@/types/workout";

// モックの設定
vi.mock("../../../../db", () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/actions/exercises", () => ({
  validateExerciseIdAndAuth: vi.fn(),
}));

// モックした後にインポート
import { saveSets, getSets, getUserMaxWeights, getLatestSetRecord } from "@/lib/actions/sets";
import { db } from "../../../../db";
import { validateExerciseIdAndAuth } from "@/lib/actions/exercises";
import { revalidateTag } from "next/cache";

describe("sets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveSets", () => {
    describe("正常系: 新規保存", () => {
      it("有効なセット配列を保存できる", async () => {
        // Given: 有効なセット配列、バリデーションOK、セッションOK
        (validateExerciseIdAndAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
          success: true,
          userId: "user1",
        });

        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ userId: "user1" }]),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          await callback({
            delete: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockResolvedValue(undefined),
            }),
          });
        });
        (db.transaction as any) = mockTransaction;

        const sets: SetRecord[] = [
          { id: "set1", setOrder: 1, weight: 60, reps: 10, isWarmup: false, duration: null },
          { id: "set2", setOrder: 2, weight: 70, reps: 8, isWarmup: false, duration: null },
        ];

        // When: セットを保存
        const result = await saveSets("user1", {
          sessionId: "session1",
          exerciseId: "exercise1",
          sets,
        });

        // Then: 保存成功
        expect(result.success).toBe(true);
        expect(result.data?.count).toBe(2);
        expect(revalidateTag).toHaveBeenCalledWith("stats:exercise");
        expect(revalidateTag).toHaveBeenCalledWith("stats:big3");
      });

      it("空配列の場合、既存削除のみ実行", async () => {
        // Given: 空配列
        (validateExerciseIdAndAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
          success: true,
          userId: "user1",
        });

        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ userId: "user1" }]),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        const mockDelete = vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        });
        (db.delete as any) = mockDelete;

        // When: 空配列で保存
        const result = await saveSets("user1", {
          sessionId: "session1",
          exerciseId: "exercise1",
          sets: [],
        });

        // Then: 削除のみ、count=0
        expect(result.success).toBe(true);
        expect(result.data?.count).toBe(0);
        expect(mockDelete).toHaveBeenCalled();
      });
    });

    describe("異常系: バリデーションエラー", () => {
      it("種目IDバリデーション失敗の場合、エラーを返す", async () => {
        // Given: バリデーション失敗
        (validateExerciseIdAndAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
          success: false,
          error: "モックデータは保存できません",
        });

        // When: セットを保存
        const result = await saveSets("user1", {
          sessionId: "session1",
          exerciseId: "mock-exercise",
          sets: [{ id: "set1", setOrder: 1, weight: 60, reps: 10, duration: null }],
        });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("モックデータは保存できません");
      });
    });

    describe("異常系: セッション権限エラー", () => {
      it("セッションが存在しない場合、エラーを返す", async () => {
        // Given: セッション不存在
        (validateExerciseIdAndAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
          success: true,
          userId: "user1",
        });

        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: セットを保存
        const result = await saveSets("user1", {
          sessionId: "nonexistent",
          exerciseId: "exercise1",
          sets: [{ id: "set1", setOrder: 1, weight: 60, reps: 10, duration: null }],
        });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("セッションが見つかりません");
      });

      it("セッションの権限がない場合、エラーを返す", async () => {
        // Given: 他人のセッション
        (validateExerciseIdAndAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
          success: true,
          userId: "user1",
        });

        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ userId: "user2" }]),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: セットを保存
        const result = await saveSets("user1", {
          sessionId: "session1",
          exerciseId: "exercise1",
          sets: [{ id: "set1", setOrder: 1, weight: 60, reps: 10, duration: null }],
        });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("このセッションにアクセスする権限がありません");
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: DBエラー
        (validateExerciseIdAndAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
          success: true,
          userId: "user1",
        });

        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error("Database error")),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: セットを保存
        const result = await saveSets("user1", {
          sessionId: "session1",
          exerciseId: "exercise1",
          sets: [{ id: "set1", setOrder: 1, weight: 60, reps: 10, duration: null }],
        });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("セット記録の保存に失敗しました");
      });
    });
  });

  describe("getSets", () => {
    describe("正常系: セット取得", () => {
      it("セット記録を取得できる", async () => {
        // Given: セッションOK、セットあり
        let callCount = 0;
        (db.select as any) = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve([{ userId: "user1" }])),
                })),
              })),
            };
          } else {
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() =>
                    Promise.resolve([
                      {
                        id: "set1",
                        setOrder: 1,
                        weight: "60",
                        reps: 10,
                        rpe: "8",
                        isWarmup: false,
                        restSeconds: 90,
                        notes: null,
                        failure: false,
                      },
                    ])
                  ),
                })),
              })),
            };
          }
        });

        // When: セットを取得
        const result = await getSets("user1", {
          sessionId: "session1",
          exerciseId: "exercise1",
        });

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].weight).toBe(60);
      });

      it("モックIDの場合、空配列を返す", async () => {
        // Given: モックID
        // When: セットを取得
        const result = await getSets("user1", {
          sessionId: "session1",
          exerciseId: "mock-exercise",
        });

        // Then: 空配列
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe("異常系: セッションエラー", () => {
      it("セッションが存在しない場合、エラーを返す", async () => {
        // Given: セッション不存在
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: セットを取得
        const result = await getSets("user1", {
          sessionId: "nonexistent",
          exerciseId: "exercise1",
        });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("セッションが見つかりません");
      });

      it("セッションの権限がない場合、エラーを返す", async () => {
        // Given: 他人のセッション
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ userId: "user2" }]),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: セットを取得
        const result = await getSets("user1", {
          sessionId: "session1",
          exerciseId: "exercise1",
        });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("このセッションにアクセスする権限がありません");
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: DBエラー
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error("Database error")),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: セットを取得
        const result = await getSets("user1", {
          sessionId: "session1",
          exerciseId: "exercise1",
        });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("セット記録の取得に失敗しました");
      });
    });
  });

  describe("getUserMaxWeights", () => {
    describe("正常系: 最大重量取得", () => {
      it("ユーザーの最大重量を取得できる", async () => {
        // Given: 最大重量データあり
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockResolvedValue([
                  { exerciseId: "exercise1", maxWeight: "100" },
                  { exerciseId: "exercise2", maxWeight: "80" },
                ]),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 最大重量を取得
        const result = await getUserMaxWeights("user1");

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          exercise1: 100,
          exercise2: 80,
        });
      });

      it("記録がない場合、空オブジェクトを返す", async () => {
        // Given: データなし
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 最大重量を取得
        const result = await getUserMaxWeights("user1");

        // Then: 空オブジェクト
        expect(result.success).toBe(true);
        expect(result.data).toEqual({});
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: DBエラー
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockRejectedValue(new Error("Database error")),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 最大重量を取得
        const result = await getUserMaxWeights("user1");

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("最大重量の取得に失敗しました");
      });
    });

    describe("境界値: 重量0", () => {
      it("重量0は除外される", async () => {
        // Given: 重量0のデータ
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockResolvedValue([
                  { exerciseId: "exercise1", maxWeight: "0" },
                  { exerciseId: "exercise2", maxWeight: "80" },
                ]),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 最大重量を取得
        const result = await getUserMaxWeights("user1");

        // Then: 重量0は除外
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          exercise2: 80,
        });
      });
    });
  });

  describe("getLatestSetRecord", () => {
    describe("正常系: 最新記録取得", () => {
      it("最新のセット記録を取得できる", async () => {
        // Given: 最新セッションとセットあり
        let callCount = 0;
        (db.select as any) = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            // 最新セッション取得
            return {
              from: vi.fn(() => ({
                innerJoin: vi.fn(() => ({
                  where: vi.fn(() => ({
                    orderBy: vi.fn(() => ({
                      limit: vi.fn(() =>
                        Promise.resolve([{ id: "session1", date: "2024-01-15" }])
                      ),
                    })),
                  })),
                })),
              })),
            };
          } else {
            // セット記録取得
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() =>
                    Promise.resolve([
                      {
                        id: "set1",
                        setOrder: 1,
                        weight: "100",
                        reps: 5,
                        rpe: "9",
                        isWarmup: false,
                        restSeconds: 180,
                        notes: null,
                        failure: false,
                      },
                    ])
                  ),
                })),
              })),
            };
          }
        });

        // When: 最新記録を取得
        const result = await getLatestSetRecord("user1", "exercise1");

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data?.sets).toHaveLength(1);
        expect(result.data?.date).toEqual(new Date("2024-01-15"));
      });

      it("記録がない場合、nullを返す", async () => {
        // Given: 最新セッションなし
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 最新記録を取得
        const result = await getLatestSetRecord("user1", "exercise1");

        // Then: null
        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: DBエラー
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockRejectedValue(new Error("Database error")),
                }),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 最新記録を取得
        const result = await getLatestSetRecord("user1", "exercise1");

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("記録の取得に失敗しました");
      });
    });
  });
});
