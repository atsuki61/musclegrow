/**
 * history.ts のテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// モックの設定
vi.mock("../../../../db", () => ({
  db: {
    select: vi.fn(),
    selectDistinct: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn, // キャッシュをバイパス
}));

// モックした後にインポート
import { getSessionDetails, getBodyPartsByDateRange } from "@/lib/actions/history";
import { db } from "../../../../db";

describe("history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSessionDetails", () => {
    describe("正常系: セッション詳細取得", () => {
      it("セッション詳細を取得できる", async () => {
        // Given: セッション、セット、有酸素記録あり
        let callCount = 0;
        (db.select as any) = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            // セッション取得
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => ({
                  limit: vi.fn(() =>
                    Promise.resolve([
                      {
                        id: "session1",
                        userId: "user1",
                        date: "2024-01-01",
                        durationMinutes: 60,
                        note: "Test workout",
                      },
                    ])
                  ),
                })),
              })),
            };
          } else if (callCount === 2) {
            // セット記録取得
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() =>
                    Promise.resolve([
                      {
                        id: "set1",
                        exerciseId: "exercise1",
                        setOrder: 1,
                        weight: "100",
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
          } else {
            // 有酸素記録取得（handleTableNotExistsErrorでエラー時は空配列）
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([])),
              })),
            };
          }
        });

        // When: セッション詳細を取得
        const result = await getSessionDetails("user1", "session1");

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data?.id).toBe("session1");
        expect(result.data?.workoutExercises).toHaveLength(1);
        expect(result.data?.cardioExercises).toHaveLength(0);
      });

      it("セットのみのセッションを取得できる", async () => {
        // Given: セットのみ
        let callCount = 0;
        (db.select as any) = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => ({
                  limit: vi.fn(() =>
                    Promise.resolve([
                      {
                        id: "session1",
                        userId: "user1",
                        date: "2024-01-01",
                        durationMinutes: null,
                        note: null,
                      },
                    ])
                  ),
                })),
              })),
            };
          } else if (callCount === 2) {
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() =>
                    Promise.resolve([
                      {
                        id: "set1",
                        exerciseId: "exercise1",
                        setOrder: 1,
                        weight: "100",
                        reps: 10,
                        rpe: null,
                        isWarmup: false,
                        restSeconds: null,
                        notes: null,
                        failure: false,
                      },
                    ])
                  ),
                })),
              })),
            };
          } else {
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([])),
              })),
            };
          }
        });

        // When: セッション詳細を取得
        const result = await getSessionDetails("user1", "session1");

        // Then: セットのみ、有酸素なし
        expect(result.success).toBe(true);
        expect(result.data?.workoutExercises).toHaveLength(1);
        expect(result.data?.cardioExercises).toHaveLength(0);
      });
    });

    describe("異常系: userIdが空", () => {
      it("userIdが空の場合、エラーを返す", async () => {
        // Given: userId=""
        // When: セッション詳細を取得
        const result = await getSessionDetails("", "session1");

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("ユーザーIDが無効です");
      });
    });

    describe("異常系: セッション不存在", () => {
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

        // When: セッション詳細を取得
        const result = await getSessionDetails("user1", "nonexistent");

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("セッションが見つかりません");
      });
    });

    describe("異常系: 権限なし", () => {
      it("他人のセッションの場合、エラーを返す", async () => {
        // Given: 他人のセッション
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "session1",
                  userId: "user2",
                  date: "2024-01-01",
                  durationMinutes: null,
                  note: null,
                },
              ]),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: セッション詳細を取得
        const result = await getSessionDetails("user1", "session1");

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("アクセス権限がありません");
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

        // When: セッション詳細を取得
        const result = await getSessionDetails("user1", "session1");

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("セッション詳細の取得に失敗しました");
      });
    });
  });

  describe("getBodyPartsByDateRange", () => {
    describe("正常系: 部位一覧取得", () => {
      it("日付範囲で部位一覧を取得できる", async () => {
        // Given: 部位データあり
        let callCount = 0;
        (db.select as any) = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            // セット記録の部位
            return {
              from: vi.fn(() => ({
                innerJoin: vi.fn(() => ({
                  innerJoin: vi.fn(() => ({
                    where: vi.fn(() => ({
                      groupBy: vi.fn(() =>
                        Promise.resolve([
                          { date: "2024-01-01", bodyPart: "chest" },
                          { date: "2024-01-01", bodyPart: "back" },
                          { date: "2024-01-02", bodyPart: "legs" },
                        ])
                      ),
                    })),
                  })),
                })),
              })),
            };
          } else {
            // 有酸素記録の部位（エラー時は空配列）
            return {
              from: vi.fn(() => ({
                innerJoin: vi.fn(() => ({
                  innerJoin: vi.fn(() => ({
                    where: vi.fn(() => ({
                      groupBy: vi.fn(() => Promise.resolve([])),
                    })),
                  })),
                })),
              })),
            };
          }
        });

        // When: 部位一覧を取得
        const result = await getBodyPartsByDateRange("user1", {
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        });

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data?.["2024-01-01"]).toContain("chest");
        expect(result.data?.["2024-01-01"]).toContain("back");
        expect(result.data?.["2024-01-02"]).toContain("legs");
      });
    });

    describe("正常系: ゲストユーザー", () => {
      it("ゲストユーザーの場合、空オブジェクトを返す", async () => {
        // Given: userId=""
        // When: 部位一覧を取得
        const result = await getBodyPartsByDateRange("", {
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        });

        // Then: 空オブジェクト
        expect(result.success).toBe(true);
        expect(result.data).toEqual({});
      });
    });

    describe("正常系: データなし", () => {
      it("記録がない場合、空オブジェクトを返す", async () => {
        // Given: データなし
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  groupBy: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 部位一覧を取得
        const result = await getBodyPartsByDateRange("user1", {
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        });

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
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  groupBy: vi.fn().mockRejectedValue(new Error("Database error")),
                }),
              }),
            }),
          }),
        });
        (db.select as any) = mockSelect;

        // When: 部位一覧を取得
        const result = await getBodyPartsByDateRange("user1", {
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("部位一覧の取得に失敗しました");
      });
    });
  });
});
