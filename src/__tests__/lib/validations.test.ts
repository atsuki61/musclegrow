/**
 * バリデーションユーティリティのテスト
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import {
  getValidationErrorMessage,
  getValidationErrorDetails,
  validateItems,
  setRecordSchema,
} from "@/lib/validations";

describe("getValidationErrorMessage", () => {
  describe("正常系: エラーメッセージ取得", () => {
    it("単一エラーの場合、最初のエラーメッセージを返す", () => {
      // Given: 単一エラーを含むZodError
      const schema = z.object({
        name: z.string().min(1, "名前は必須です"),
      });
      const result = schema.safeParse({ name: "" });
      expect(result.success).toBe(false);

      if (!result.success) {
        // When: エラーメッセージを取得
        const message = getValidationErrorMessage(result.error);

        // Then: 最初のエラーメッセージが返る
        expect(message).toBe("名前は必須です");
      }
    });

    it("複数エラーの場合、最初のエラーメッセージを返す", () => {
      // Given: 複数エラーを含むZodError
      const schema = z.object({
        name: z.string().min(1, "名前は必須です"),
        age: z.number().min(0, "年齢は0以上で入力してください"),
      });
      const result = schema.safeParse({ name: "", age: -1 });
      expect(result.success).toBe(false);

      if (!result.success) {
        // When: エラーメッセージを取得
        const message = getValidationErrorMessage(result.error);

        // Then: 最初のエラーメッセージが返る（nameのエラー）
        expect(message).toBe("名前は必須です");
      }
    });

    it("エラーメッセージがない場合、デフォルトメッセージを返す", () => {
      // Given: エラーメッセージがないZodError（手動で作成）
      const error = new z.ZodError([
        {
          code: "custom",
          path: ["field"],
          message: "",
        },
      ]);

      // When: エラーメッセージを取得
      const message = getValidationErrorMessage(error);

      // Then: デフォルトメッセージが返る（空文字列はfalsyなのでデフォルトになる）
      expect(message).toBe("バリデーションエラーが発生しました");
    });
  });
});

describe("getValidationErrorDetails", () => {
  describe("正常系: エラー詳細取得", () => {
    it("単一エラーの場合、パスとメッセージのマップを返す", () => {
      // Given: 単一エラーを含むZodError
      const schema = z.object({
        name: z.string().min(1, "名前は必須です"),
      });
      const result = schema.safeParse({ name: "" });
      expect(result.success).toBe(false);

      if (!result.success) {
        // When: エラー詳細を取得
        const details = getValidationErrorDetails(result.error);

        // Then: パスとメッセージのマップが返る
        expect(details).toEqual({
          name: "名前は必須です",
        });
      }
    });

    it("複数エラーの場合、全てのパスとメッセージのマップを返す", () => {
      // Given: 複数エラーを含むZodError
      const schema = z.object({
        name: z.string().min(1, "名前は必須です"),
        age: z.number().min(0, "年齢は0以上で入力してください"),
      });
      const result = schema.safeParse({ name: "", age: -1 });
      expect(result.success).toBe(false);

      if (!result.success) {
        // When: エラー詳細を取得
        const details = getValidationErrorDetails(result.error);

        // Then: 全てのパスとメッセージのマップが返る
        expect(details).toEqual({
          name: "名前は必須です",
          age: "年齢は0以上で入力してください",
        });
      }
    });

    it("ネストしたパスの場合、ドット区切りのパスを返す", () => {
      // Given: ネストしたフィールドのエラー
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1, "名前は必須です"),
          }),
        }),
      });
      const result = schema.safeParse({
        user: { profile: { name: "" } },
      });
      expect(result.success).toBe(false);

      if (!result.success) {
        // When: エラー詳細を取得
        const details = getValidationErrorDetails(result.error);

        // Then: ドット区切りのパスが返る
        expect(details).toEqual({
          "user.profile.name": "名前は必須です",
        });
      }
    });

    it("配列のインデックスを含むパスの場合、正しく返す", () => {
      // Given: 配列のインデックスを含むエラー
      const schema = z.object({
        items: z.array(
          z.object({
            name: z.string().min(1, "名前は必須です"),
          })
        ),
      });
      const result = schema.safeParse({
        items: [{ name: "valid" }, { name: "" }],
      });
      expect(result.success).toBe(false);

      if (!result.success) {
        // When: エラー詳細を取得
        const details = getValidationErrorDetails(result.error);

        // Then: 配列のインデックスを含むパスが返る
        expect(details).toEqual({
          "items.1.name": "名前は必須です",
        });
      }
    });
  });
});

describe("validateItems", () => {
  // テスト用の簡単なスキーマ
  const testSchema = z.object({
    id: z.string().min(1),
    value: z.number().min(0),
  });

  // console.errorのモック
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
  });

  describe("正常系: 全て有効", () => {
    it("全て有効なアイテムの場合、空配列を返す", () => {
      // Given: 全て有効なアイテム
      const items = [
        { id: "1", value: 100 },
        { id: "2", value: 200 },
        { id: "3", value: 300 },
      ];

      // When: バリデーションを実行
      const result = validateItems(items, testSchema, "アイテム");

      // Then: 空配列が返る
      expect(result).toEqual([]);
    });
  });

  describe("正常系: 一部無効", () => {
    it("一部無効なアイテムの場合、無効なインデックス（1ベース）を返す", () => {
      // Given: 一部無効なアイテム（2番目と4番目が無効）
      const items = [
        { id: "1", value: 100 },
        { id: "", value: 200 }, // 無効: idが空
        { id: "3", value: 300 },
        { id: "4", value: -1 }, // 無効: valueが負
      ];

      // When: バリデーションを実行
      // 開発環境でない場合はconsole.errorが呼ばれないようにする
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      const result = validateItems(items, testSchema, "アイテム");
      process.env.NODE_ENV = originalEnv;

      // Then: 無効なインデックス（1ベース）が返る
      expect(result).toEqual([2, 4]);
    });

    it("最初のアイテムが無効な場合、[1]を返す", () => {
      // Given: 最初のアイテムが無効
      const items = [
        { id: "", value: 100 }, // 無効
        { id: "2", value: 200 },
      ];

      // When: バリデーションを実行
      const result = validateItems(items, testSchema, "アイテム");

      // Then: [1]が返る
      expect(result).toEqual([1]);
    });

    it("最後のアイテムが無効な場合、正しいインデックスを返す", () => {
      // Given: 最後のアイテムが無効
      const items = [
        { id: "1", value: 100 },
        { id: "2", value: 200 },
        { id: "", value: 300 }, // 無効
      ];

      // When: バリデーションを実行
      const result = validateItems(items, testSchema, "アイテム");

      // Then: [3]が返る
      expect(result).toEqual([3]);
    });
  });

  describe("正常系: 全て無効", () => {
    it("全て無効なアイテムの場合、全てのインデックスを返す", () => {
      // Given: 全て無効なアイテム
      const items = [
        { id: "", value: 100 }, // 無効
        { id: "2", value: -1 }, // 無効
        { id: "", value: -1 }, // 無効
      ];

      // When: バリデーションを実行
      const result = validateItems(items, testSchema, "アイテム");

      // Then: 全てのインデックスが返る
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("正常系: 空配列", () => {
    it("空配列の場合、空配列を返す", () => {
      // Given: 空配列
      const items: Array<{ id: string; value: number }> = [];

      // When: バリデーションを実行
      const result = validateItems(items, testSchema, "アイテム");

      // Then: 空配列が返る
      expect(result).toEqual([]);
    });
  });

  describe("正常系: console.errorの出力（開発環境）", () => {
    it("開発環境でエラーがある場合、console.errorが呼ばれる", () => {
      // Given: 無効なアイテム & 開発環境
      const items = [{ id: "", value: 100 }];
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      // console.errorをモック
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // When: バリデーションを実行
      const result = validateItems(items, testSchema, "テスト項目");

      // Then: console.errorが呼ばれる
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "テスト項目1のバリデーションエラー:",
        expect.any(Object)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "テスト項目1のデータ:",
        expect.any(String)
      );

      // 環境を戻す
      process.env.NODE_ENV = originalEnv;
    });

    it("開発環境以外でエラーがある場合、console.errorが呼ばれない", () => {
      // Given: 無効なアイテム & 本番環境
      const items = [{ id: "", value: 100 }];
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      // console.errorをモック
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // When: バリデーションを実行
      const result = validateItems(items, testSchema, "テスト項目");

      // Then: console.errorが呼ばれない
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // 環境を戻す
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("正常系: 実際のスキーマでのテスト", () => {
    it("setRecordSchemaで無効なデータの場合、正しく検出する", () => {
      // Given: setRecordSchemaに対して無効なデータ
      const items = [
        {
          id: "1",
          setOrder: 1,
          weight: 100,
          reps: 10,
        }, // 有効
        {
          id: "2",
          setOrder: 0, // 無効: 1以上が必要
          weight: 100,
          reps: 10,
        },
        {
          id: "3",
          setOrder: 3,
          weight: -1, // 無効: 0以上が必要
          reps: 10,
        },
      ];

      // When: バリデーションを実行
      const result = validateItems(items, setRecordSchema, "セット");

      // Then: 無効なインデックスが返る
      expect(result).toEqual([2, 3]);
    });

    it("setRecordSchemaで時間ベース種目（reps=0でもOK）の場合、有効と判定される", () => {
      // Given: 時間ベース種目（duration > 0, reps = 0）
      const items = [
        {
          id: "1",
          setOrder: 1,
          weight: 0,
          reps: 0,
          duration: 60, // 時間ベース
        },
      ];

      // When: バリデーションを実行
      const result = validateItems(items, setRecordSchema, "セット");

      // Then: 有効と判定される
      expect(result).toEqual([]);
    });

    it("setRecordSchemaで通常種目（reps=0はNG）の場合、無効と判定される", () => {
      // Given: 通常種目（duration無し, reps = 0）
      const items = [
        {
          id: "1",
          setOrder: 1,
          weight: 100,
          reps: 0, // 無効: 時間ベースでない場合は1以上が必要
        },
      ];

      // When: バリデーションを実行
      const result = validateItems(items, setRecordSchema, "セット");

      // Then: 無効と判定される
      expect(result).toEqual([1]);
    });
  });
});
