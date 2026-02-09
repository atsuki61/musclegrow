/**
 * big3-progress.ts のテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// モックの設定
vi.mock("../../../../db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn, // キャッシュをバイパス
}));

// モックした後にインポート
import { getBig3MaxWeights } from "@/lib/actions/big3-progress";
import { db } from "../../../../db";

describe("big3-progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBig3MaxWeights", () => {
    describe("正常系: Big3最大重量取得", () => {
      it("ログインユーザーのBig3最大重量を取得できる", async () => {
        // Given: Big3種目とセット記録あり
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
          } else if (callCount === 2) {
            // ユーザーセッション取得
            return {
              from: vi.fn(() => ({
                where: vi.fn(() =>
                  Promise.resolve([{ id: "session1" }, { id: "session2" }])
                ),
              })),
            };
          } else {
            // 最大重量取得
            return {
              from: vi.fn(() => ({
                where: vi.fn(() =>
                  Promise.resolve([{ maxWeight: callCount === 3 ? 100 : callCount === 4 ? 120 : 140 }])
                ),
              })),
            };
          }
        });

        // When: Big3最大重量を取得
        const result = await getBig3MaxWeights("user1");

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data?.benchPress.exerciseId).toBe("bench-press");
        expect(result.data?.squat.exerciseId).toBe("squat");
        expect(result.data?.deadlift.exerciseId).toBe("deadlift");
      });
    });

    describe("正常系: ゲストユーザー", () => {
      it("ゲストユーザーの場合、空データを返す", async () => {
        // Given: Big3種目あり
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { id: "bench-press", name: "ベンチプレス" },
              { id: "squat", name: "スクワット" },
              { id: "deadlift", name: "デッドリフト" },
            ]),
          }),
        });
        (db.select as any) = mockSelect;

        // When: ゲストユーザーでBig3最大重量を取得
        const result = await getBig3MaxWeights(null);

        // Then: 空データ（maxWeight=0）
        expect(result.success).toBe(true);
        expect(result.data?.benchPress.maxWeight).toBe(0);
        expect(result.data?.squat.maxWeight).toBe(0);
        expect(result.data?.deadlift.maxWeight).toBe(0);
      });
    });

    describe("正常系: 記録なし", () => {
      it("セッションがない場合、空データを返す", async () => {
        // Given: Big3種目あり、セッションなし
        let callCount = 0;
        (db.select as any) = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
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
            // セッションなし
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([])),
              })),
            };
          }
        });

        // When: Big3最大重量を取得
        const result = await getBig3MaxWeights("user1");

        // Then: 空データ
        expect(result.success).toBe(true);
        expect(result.data?.benchPress.maxWeight).toBe(0);
        expect(result.data?.squat.maxWeight).toBe(0);
        expect(result.data?.deadlift.maxWeight).toBe(0);
      });
    });

    describe("正常系: Big3種目が見つからない", () => {
      it("Big3種目が見つからない場合、空データを返す", async () => {
        // Given: Big3種目が不完全
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { id: "bench-press", name: "ベンチプレス" },
              // スクワットとデッドリフトが欠けている
            ]),
          }),
        });
        (db.select as any) = mockSelect;

        // When: Big3最大重量を取得
        const result = await getBig3MaxWeights("user1");

        // Then: 空データ
        expect(result.success).toBe(true);
        expect(result.data?.benchPress.exerciseId).toBe("bench-press");
        expect(result.data?.squat.exerciseId).toBe("");
        expect(result.data?.deadlift.exerciseId).toBe("");
      });
    });

    describe("異常系: DB接続エラー", () => {
      it("ECONNREFUSED エラーの場合、空データを返す", async () => {
        // Given: DB接続エラー
        const mockError = new Error("connect ECONNREFUSED");
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(mockError),
          }),
        });
        (db.select as any) = mockSelect;

        // When: Big3最大重量を取得
        const result = await getBig3MaxWeights("user1");

        // Then: 空データ（フォールバック）
        expect(result.success).toBe(true);
        expect(result.data?.benchPress.maxWeight).toBe(0);
      });
    });

    describe("異常系: テーブル不存在エラー", () => {
      it("does not exist エラーの場合、空データを返す", async () => {
        // Given: テーブル不存在エラー
        const mockError = new Error("relation does not exist");
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(mockError),
          }),
        });
        (db.select as any) = mockSelect;

        // When: Big3最大重量を取得
        const result = await getBig3MaxWeights("user1");

        // Then: 空データ（フォールバック）
        expect(result.success).toBe(true);
        expect(result.data?.benchPress.maxWeight).toBe(0);
      });
    });

    describe("異常系: その他DBエラー", () => {
      it("一般的なDBエラーの場合、空データを返す", async () => {
        // Given: 一般的なDBエラー
        const mockError = new Error("Database error");
        const mockSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(mockError),
          }),
        });
        (db.select as any) = mockSelect;

        // When: Big3最大重量を取得
        const result = await getBig3MaxWeights("user1");

        // Then: 空データ（フォールバック）
        expect(result.success).toBe(true);
        expect(result.data?.benchPress.maxWeight).toBe(0);
      });
    });
  });
});
