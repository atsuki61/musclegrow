/**
 * user-exercises.ts のテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// モックの設定
vi.mock("../../../db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// モックした後にインポート
import {
  getExercisesWithUserPreferences,
  toggleExerciseVisibility,
} from "./user-exercises";
import { db } from "../../../db";

describe("user-exercises", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getExercisesWithUserPreferences", () => {
    describe("正常系: ユーザー設定の反映", () => {
      it("ユーザー設定でvisible=trueの場合、tier: 'initial'になる", async () => {
        // Given: ユーザー設定あり（visible=true）
        const mockExercises = [
          {
            id: "ex1",
            name: "種目1",
            tier: "selectable",
            userId: null,
          },
        ];

        const mockSettings = [
          {
            userId: "user1",
            exerciseId: "ex1",
            isVisible: true,
          },
        ];

        // db.select().from(exercises)
        const mockFrom1 = vi.fn().mockResolvedValue(mockExercises);
        // db.select().from(userExerciseSettings).where(...)
        const mockWhere = vi.fn().mockResolvedValue(mockSettings);
        const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere });

        let fromCallCount = 0;
        const mockSelect = vi.fn(() => {
          fromCallCount++;
          return { from: fromCallCount === 1 ? mockFrom1 : mockFrom2 };
        });
        (db.select as any) = mockSelect;

        // When: 種目リストを取得
        const result = await getExercisesWithUserPreferences("user1");

        // Then: tier が "initial" に変更される
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].tier).toBe("initial");
      });

      it("ユーザー設定でvisible=falseの場合、tier: 'selectable'になる", async () => {
        // Given: ユーザー設定あり（visible=false）
        const mockExercises = [
          {
            id: "ex1",
            name: "種目1",
            tier: "initial",
            userId: null,
          },
        ];

        const mockSettings = [
          {
            userId: "user1",
            exerciseId: "ex1",
            isVisible: false,
          },
        ];

        const mockFrom1 = vi.fn().mockResolvedValue(mockExercises);
        const mockWhere = vi.fn().mockResolvedValue(mockSettings);
        const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere });

        let fromCallCount = 0;
        const mockSelect = vi.fn(() => {
          fromCallCount++;
          return { from: fromCallCount === 1 ? mockFrom1 : mockFrom2 };
        });
        (db.select as any) = mockSelect;

        // When: 種目リストを取得
        const result = await getExercisesWithUserPreferences("user1");

        // Then: tier が "selectable" に変更される
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].tier).toBe("selectable");
      });

      it("ユーザー設定がない場合、デフォルトのtierが使用される", async () => {
        // Given: ユーザー設定なし
        const mockExercises = [
          {
            id: "ex1",
            name: "種目1",
            tier: "tier1",
            userId: null,
          },
        ];

        const mockSettings: any[] = [];

        const mockFrom1 = vi.fn().mockResolvedValue(mockExercises);
        const mockWhere = vi.fn().mockResolvedValue(mockSettings);
        const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere });

        let fromCallCount = 0;
        const mockSelect = vi.fn(() => {
          fromCallCount++;
          return { from: fromCallCount === 1 ? mockFrom1 : mockFrom2 };
        });
        (db.select as any) = mockSelect;

        // When: 種目リストを取得
        const result = await getExercisesWithUserPreferences("user1");

        // Then: デフォルトの tier が使用される
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].tier).toBe("tier1");
      });
    });

    describe("正常系: 他人のカスタム種目の除外", () => {
      it("他人のカスタム種目は除外される", async () => {
        // Given: 他人のカスタム種目
        const mockExercises = [
          {
            id: "ex1",
            name: "自分の種目",
            tier: "tier1",
            userId: "user1",
          },
          {
            id: "ex2",
            name: "他人の種目",
            tier: "tier1",
            userId: "user2", // 他人のカスタム種目
          },
        ];

        const mockSettings: any[] = [];

        const mockFrom1 = vi.fn().mockResolvedValue(mockExercises);
        const mockWhere = vi.fn().mockResolvedValue(mockSettings);
        const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere });

        let fromCallCount = 0;
        const mockSelect = vi.fn(() => {
          fromCallCount++;
          return { from: fromCallCount === 1 ? mockFrom1 : mockFrom2 };
        });
        (db.select as any) = mockSelect;

        // When: 種目リストを取得
        const result = await getExercisesWithUserPreferences("user1");

        // Then: 自分の種目のみ含まれる
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].id).toBe("ex1");
      });
    });

    describe("異常系: 無効な入力", () => {
      it("userIdが空の場合、エラーを返す", async () => {
        // Given: 空のuserId
        const userId = "";

        // When: 種目リストを取得
        const result = await getExercisesWithUserPreferences(userId);

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("ユーザーIDが無効です");
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: DBエラー
        const mockFrom1 = vi
          .fn()
          .mockRejectedValue(new Error("Database connection failed"));
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom1 });
        (db.select as any) = mockSelect;

        // When: 種目リストを取得
        const result = await getExercisesWithUserPreferences("user1");

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("種目の取得に失敗しました");
      });
    });
  });

  describe("toggleExerciseVisibility", () => {
    describe("正常系: 設定保存", () => {
      it("設定を保存できる", async () => {
        // Given: 有効な入力
        const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
        const mockValues = vi
          .fn()
          .mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
        const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
        (db.insert as any) = mockInsert;

        // When: 設定を保存
        const result = await toggleExerciseVisibility("user1", "ex1", true);

        // Then: 成功
        expect(result.success).toBe(true);
      });
    });

    describe("異常系: 無効な入力", () => {
      it("userIdが空の場合、エラーを返す", async () => {
        // Given: 空のuserId
        const userId = "";

        // When: 設定を保存
        const result = await toggleExerciseVisibility(userId, "ex1", true);

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("ユーザーIDが無効です");
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: DBエラー
        const mockOnConflictDoUpdate = vi
          .fn()
          .mockRejectedValue(new Error("Database connection failed"));
        const mockValues = vi
          .fn()
          .mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
        const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
        (db.insert as any) = mockInsert;

        // When: 設定を保存
        const result = await toggleExerciseVisibility("user1", "ex1", true);

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("設定の保存に失敗しました");
      });
    });
  });
});
