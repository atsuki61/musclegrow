/**
 * profile.ts のテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// モックの設定
vi.mock("../../../../db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth-session-server", () => ({
  getAuthUserId: vi.fn(),
}));

vi.mock("@/lib/utils/bmi", () => ({
  calculateBMI: vi.fn((height, weight) => {
    return (weight / Math.pow(height / 100, 2));
  }),
}));

// モックした後にインポート
import { getProfile, updateProfile, getBig3TargetValues } from "@/lib/actions/profile";
import { db } from "../../../../db";
import { getAuthUserId } from "@/lib/auth-session-server";

describe("profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    describe("正常系: 既存プロフィールの取得", () => {
      it("既存プロフィールがある場合、プロフィールを返す", async () => {
        // Given: 認証ユーザーと既存プロフィール
        (getAuthUserId as ReturnType<typeof vi.fn>).mockResolvedValue("user1");

        const mockProfile = {
          id: "profile1",
          userId: "user1",
          height: "170",
          weight: "70",
          bodyFat: null,
          muscleMass: null,
          big3TargetBenchPress: "60",
          big3TargetSquat: "80",
          big3TargetDeadlift: "100",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        };

        const mockLimit = vi.fn().mockResolvedValue([mockProfile]);
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
        (db.select as any) = mockSelect;

        // When: プロフィールを取得
        const result = await getProfile();

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data?.userId).toBe("user1");
        expect(result.data?.height).toBe(170);
        expect(result.data?.weight).toBe(70);
      });
    });

    describe("正常系: 新規プロフィールの作成", () => {
      it("プロフィールがない場合、新規作成する", async () => {
        // Given: 認証ユーザー、既存プロフィールなし
        (getAuthUserId as ReturnType<typeof vi.fn>).mockResolvedValue("user1");

        const mockNewProfile = {
          id: "profile1",
          userId: "user1",
          height: null,
          weight: null,
          bodyFat: null,
          muscleMass: null,
          big3TargetBenchPress: null,
          big3TargetSquat: null,
          big3TargetDeadlift: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        };

        // select: プロフィールなし
        const mockLimit = vi.fn().mockResolvedValue([]);
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
        (db.select as any) = mockSelect;

        // insert: 新規作成
        const mockReturning = vi.fn().mockResolvedValue([mockNewProfile]);
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
        const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
        (db.insert as any) = mockInsert;

        // When: プロフィールを取得
        const result = await getProfile();

        // Then: 新規作成されて返る
        expect(result.success).toBe(true);
        expect(result.data?.userId).toBe("user1");
        expect(result.data?.height).toBeNull();
      });
    });

    describe("異常系: 未認証", () => {
      it("未認証の場合、エラーを返す", async () => {
        // Given: 未認証
        (getAuthUserId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        // When: プロフィールを取得
        const result = await getProfile();

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("認証が必要です");
      });
    });

    describe("異常系: DBエラー", () => {
      it("DBエラーの場合、エラーを返す", async () => {
        // Given: 認証ユーザー、DBエラー
        (getAuthUserId as ReturnType<typeof vi.fn>).mockResolvedValue("user1");

        const mockLimit = vi
          .fn()
          .mockRejectedValue(new Error("Database connection failed"));
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
        (db.select as any) = mockSelect;

        // When: プロフィールを取得
        const result = await getProfile();

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("プロフィールの取得に失敗しました");
      });
    });
  });

  describe("updateProfile", () => {
    describe("正常系: プロフィール更新", () => {
      it("既存プロフィールを更新できる", async () => {
        // Given: 認証ユーザー、既存プロフィール
        (getAuthUserId as ReturnType<typeof vi.fn>).mockResolvedValue("user1");

        const mockExistingProfile = {
          id: "profile1",
          userId: "user1",
          height: "170",
          weight: "70",
          bodyFat: null,
          muscleMass: null,
          big3TargetBenchPress: null,
          big3TargetSquat: null,
          big3TargetDeadlift: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        };

        const mockUpdatedProfile = {
          ...mockExistingProfile,
          weight: "75",
          updatedAt: new Date("2024-01-02"),
        };

        // select: 既存プロフィール取得（2回呼ばれる）
        let selectCallCount = 0;
        const mockLimit = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) {
            // 最初のselect: 既存プロフィール確認
            return Promise.resolve([mockExistingProfile]);
          } else {
            // 2回目以降: 履歴確認
            return Promise.resolve([]);
          }
        });
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
        (db.select as any) = mockSelect;

        // update: プロフィール更新
        const mockReturning = vi.fn().mockResolvedValue([mockUpdatedProfile]);
        const mockUpdateWhere = vi
          .fn()
          .mockReturnValue({ returning: mockReturning });
        const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
        (db.update as any) = mockUpdate;

        // insert: 履歴保存
        const mockInsertValues = vi.fn().mockResolvedValue(undefined);
        const mockInsert = vi
          .fn()
          .mockReturnValue({ values: mockInsertValues });
        (db.insert as any) = mockInsert;

        // When: プロフィールを更新
        const result = await updateProfile({ weight: 75 });

        // Then: 成功
        expect(result.success).toBe(true);
        expect(result.data?.weight).toBe(75);
      });
    });

    describe("異常系: 未認証", () => {
      it("未認証の場合、エラーを返す", async () => {
        // Given: 未認証
        (getAuthUserId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        // When: プロフィールを更新
        const result = await updateProfile({ weight: 75 });

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("認証が必要です");
      });
    });

    describe("異常系: バリデーションエラー", () => {
      it("無効なデータの場合、エラーを返す", async () => {
        // Given: 認証ユーザー、無効なデータ
        (getAuthUserId as ReturnType<typeof vi.fn>).mockResolvedValue("user1");

        // When: 無効なデータで更新
        const result = await updateProfile({ weight: "invalid" });

        // Then: バリデーションエラー
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe("異常系: 更新データなし", () => {
      it("更新データがない場合、エラーを返す", async () => {
        // Given: 認証ユーザー、空のデータ
        (getAuthUserId as ReturnType<typeof vi.fn>).mockResolvedValue("user1");

        // When: 空データで更新
        const result = await updateProfile({});

        // Then: エラー
        expect(result.success).toBe(false);
        expect(result.error).toBe("更新するデータがありません");
      });
    });
  });

  describe("getBig3TargetValues", () => {
    describe("正常系: ゲストユーザー", () => {
      it("ゲストユーザーの場合、デフォルト値を返す", async () => {
        // Given: ゲストユーザー
        const userId = null;

        // When: Big3目標値を取得
        const result = await getBig3TargetValues(userId);

        // Then: デフォルト値
        expect(result.success).toBe(true);
        expect(result.data?.benchPress).toBe(60);
        expect(result.data?.squat).toBe(80);
        expect(result.data?.deadlift).toBe(100);
      });
    });

    describe("正常系: プロフィールなし", () => {
      it("プロフィールがない場合、デフォルト値を返す", async () => {
        // Given: ログインユーザー、プロフィールなし
        const mockLimit = vi.fn().mockResolvedValue([]);
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
        (db.select as any) = mockSelect;

        // When: Big3目標値を取得
        const result = await getBig3TargetValues("user1");

        // Then: デフォルト値
        expect(result.success).toBe(true);
        expect(result.data?.benchPress).toBe(60);
        expect(result.data?.squat).toBe(80);
        expect(result.data?.deadlift).toBe(100);
      });
    });

    describe("正常系: カスタム値あり", () => {
      it("カスタム値がある場合、カスタム値を返す", async () => {
        // Given: ログインユーザー、カスタム値あり
        const mockProfile = {
          benchPress: "70",
          squat: "90",
          deadlift: "110",
        };

        const mockLimit = vi.fn().mockResolvedValue([mockProfile]);
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
        (db.select as any) = mockSelect;

        // When: Big3目標値を取得
        const result = await getBig3TargetValues("user1");

        // Then: カスタム値
        expect(result.success).toBe(true);
        expect(result.data?.benchPress).toBe(70);
        expect(result.data?.squat).toBe(90);
        expect(result.data?.deadlift).toBe(110);
      });
    });
  });
});
