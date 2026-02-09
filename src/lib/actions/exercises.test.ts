/**
 * exercises.ts のテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Exercise } from "@/types/workout";

// モックの設定
vi.mock("../../../db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn, // キャッシュをバイパス
  revalidateTag: vi.fn(),
}));

// モックした後にインポート
import {
  validateExerciseIdAndAuth,
  saveExercise,
  getExercises,
} from "./exercises";
import { db } from "../../../db";
import { revalidateTag } from "next/cache";

describe("validateExerciseIdAndAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("正常系", () => {
    it("有効な種目IDでアクセス権限がある場合、successを返す", async () => {
      // Given: 有効な種目IDとユーザーID
      const mockExercise = {
        id: "bench-press",
        name: "ベンチプレス",
        userId: null, // 共通マスタ
      };

      // モックのチェーンを設定
      const mockLimit = vi.fn().mockResolvedValue([mockExercise]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as any) = mockSelect;

      // When: バリデーションを実行
      const result = await validateExerciseIdAndAuth("user1", "bench-press");

      // Then: success: trueが返る
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.userId).toBe("user1");
      }
    });
  });

  describe("異常系: mock-で始まるID", () => {
    it("mock-で始まるIDの場合、エラーを返す", async () => {
      // Given: mock-で始まる種目ID
      const exerciseId = "mock-bench-press";

      // When: バリデーションを実行
      const result = await validateExerciseIdAndAuth("user1", exerciseId);

      // Then: エラーが返る
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("モックデータは保存できません");
      }
    });
  });

  describe("異常系: 種目が存在しない", () => {
    it("種目が存在しない場合、エラーを返す", async () => {
      // Given: 存在しない種目ID
      const mockLimit = vi
        .fn()
        .mockResolvedValueOnce([]) // 最初のクエリ（ユーザー権限チェック）
        .mockResolvedValueOnce([]); // 2回目のクエリ（種目存在チェック）
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as any) = mockSelect;

      // When: バリデーションを実行
      const result = await validateExerciseIdAndAuth("user1", "nonexistent");

      // Then: エラーが返る
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('種目ID "nonexistent" が見つかりません');
      }
    });
  });

  describe("異常系: アクセス権限がない", () => {
    it("種目は存在するがアクセス権限がない場合、エラーを返す", async () => {
      // Given: 他のユーザーの種目
      const mockOtherUserExercise = {
        id: "other-exercise",
        name: "他人の種目",
        userId: "user2",
      };

      const mockLimit = vi
        .fn()
        .mockResolvedValueOnce([]) // 最初のクエリ（権限チェック失敗）
        .mockResolvedValueOnce([mockOtherUserExercise]); // 2回目（種目は存在）
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as any) = mockSelect;

      // When: バリデーションを実行
      const result = await validateExerciseIdAndAuth("user1", "other-exercise");

      // Then: 権限エラーが返る
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("権限がありません");
      }
    });
  });
});

describe("saveExercise", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockExercise: Exercise = {
    id: "custom-exercise",
    name: "カスタム種目",
    nameEn: "Custom Exercise",
    bodyPart: "chest",
    muscleSubGroup: "upper",
    primaryEquipment: "barbell",
    tier: "tier1",
    isBig3: false,
    createdAt: new Date("2024-01-01"),
  };

  describe("正常系", () => {
    it("新しい種目を保存できる", async () => {
      // Given: 既存の種目なし、保存成功
      const mockReturning = vi.fn().mockResolvedValue([
        {
          ...mockExercise,
          userId: "user1",
          nameEn: mockExercise.nameEn,
          muscleSubGroup: mockExercise.muscleSubGroup,
          primaryEquipment: mockExercise.primaryEquipment,
        },
      ]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      const mockLimit = vi.fn().mockResolvedValue([]); // 既存なし
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

      (db.select as any) = mockSelect;
      (db.insert as any) = mockInsert;

      // When: 種目を保存
      const result = await saveExercise("user1", mockExercise);

      // Then: 保存成功
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe("custom-exercise");
      expect(revalidateTag).toHaveBeenCalledWith("exercises");
    });
  });

  describe("異常系: 既に存在する種目ID", () => {
    it("既に存在する種目IDの場合、エラーを返す", async () => {
      // Given: 既存の種目あり
      const mockLimit = vi.fn().mockResolvedValue([mockExercise]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

      (db.select as any) = mockSelect;

      // When: 種目を保存
      const result = await saveExercise("user1", mockExercise);

      // Then: エラーが返る
      expect(result.success).toBe(false);
      expect(result.error).toContain("既に存在します");
    });
  });

  describe("異常系: unique制約違反", () => {
    it("unique制約違反の場合、エラーを返す", async () => {
      // Given: unique制約違反エラー
      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error("duplicate key value violates unique constraint"));
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      const mockLimit = vi.fn().mockResolvedValue([]); // 既存チェックはパス
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

      (db.select as any) = mockSelect;
      (db.insert as any) = mockInsert;

      // When: 種目を保存
      const result = await saveExercise("user1", mockExercise);

      // Then: エラーが返る
      expect(result.success).toBe(false);
      expect(result.error).toContain("既に存在します");
    });
  });

  describe("異常系: 一般的なDBエラー", () => {
    it("一般的なDBエラーの場合、エラーを返す", async () => {
      // Given: 一般的なDBエラー
      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error("Database connection failed"));
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      const mockLimit = vi.fn().mockResolvedValue([]); // 既存チェックはパス
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

      (db.select as any) = mockSelect;
      (db.insert as any) = mockInsert;

      // When: 種目を保存
      const result = await saveExercise("user1", mockExercise);

      // Then: エラーが返る
      expect(result.success).toBe(false);
      expect(result.error).toBe("種目の保存に失敗しました");
    });
  });
});

describe("getExercises", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockExercises = [
    {
      id: "bench-press",
      name: "ベンチプレス",
      nameEn: "Bench Press",
      bodyPart: "chest",
      muscleSubGroup: null,
      primaryEquipment: null,
      tier: "tier1",
      isBig3: true,
      userId: null,
      createdAt: new Date("2024-01-01"),
    },
    {
      id: "squat",
      name: "スクワット",
      nameEn: "Squat",
      bodyPart: "legs",
      muscleSubGroup: null,
      primaryEquipment: null,
      tier: "tier1",
      isBig3: true,
      userId: null,
      createdAt: new Date("2024-01-02"),
    },
  ];

  describe("正常系: ゲストユーザー", () => {
    it("ゲストユーザーの種目を取得できる", async () => {
      // Given: ゲストユーザー
      const mockOrderBy = vi.fn().mockResolvedValue(mockExercises);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

      (db.select as any) = mockSelect;

      // When: 種目を取得
      const result = await getExercises(null);

      // Then: 成功
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].id).toBe("bench-press");
    });
  });

  describe("正常系: ログインユーザー", () => {
    it("ログインユーザーの種目を取得できる", async () => {
      // Given: ログインユーザー
      const mockOrderBy = vi.fn().mockResolvedValue(mockExercises);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

      (db.select as any) = mockSelect;

      // When: 種目を取得
      const result = await getExercises("user1");

      // Then: 成功
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe("異常系: データベースエラー", () => {
    it("データベースエラーの場合、空配列を返す", async () => {
      // Given: データベースエラー
      const mockOrderBy = vi
        .fn()
        .mockRejectedValue(new Error("Database connection failed"));
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

      (db.select as any) = mockSelect;

      // When: 種目を取得
      const result = await getExercises("user1");

      // Then: success: true, 空配列
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
