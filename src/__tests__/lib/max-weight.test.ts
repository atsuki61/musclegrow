/**
 * 最大重量キャッシュのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadMaxWeightsCache,
  saveMaxWeightsCache,
  calculateMaxWeightsFromStorage,
  type MaxWeightsMap,
} from "@/lib/max-weight";

describe("max-weight", () => {
  // localStorageのモック
  let localStorageMock: { [key: string]: string };
  let getItemSpy: ReturnType<typeof vi.fn>;
  let setItemSpy: ReturnType<typeof vi.fn>;
  let keySpy: ReturnType<typeof vi.fn>;
  let lengthGetter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // localStorageのモックを初期化
    localStorageMock = {};

    getItemSpy = vi.fn((key: string) => localStorageMock[key] || null);
    setItemSpy = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    keySpy = vi.fn((index: number) => {
      const keys = Object.keys(localStorageMock);
      return keys[index] || null;
    });
    lengthGetter = vi.fn(() => Object.keys(localStorageMock).length);

    // windowオブジェクトにlocalStorageを定義
    Object.defineProperty(global, "window", {
      value: {
        localStorage: {
          getItem: getItemSpy,
          setItem: setItemSpy,
          key: keySpy,
          get length() {
            return lengthGetter();
          },
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // モックをクリア
    vi.restoreAllMocks();
  });

  describe("loadMaxWeightsCache", () => {
    describe("正常系: キャッシュあり", () => {
      it("有効なキャッシュがある場合、キャッシュを返す", () => {
        // Given: 有効なキャッシュ
        localStorageMock["max_weights_version_v2"] = "2";
        localStorageMock["max_weights_cache_v2"] = JSON.stringify({
          ex1: 100,
          ex2: 150,
        });

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: キャッシュが返る
        expect(result).toEqual({
          ex1: 100,
          ex2: 150,
        });
      });

      it("複数の種目のキャッシュを正しくロードする", () => {
        // Given: 複数種目のキャッシュ
        localStorageMock["max_weights_version_v2"] = "2";
        localStorageMock["max_weights_cache_v2"] = JSON.stringify({
          benchPress: 100,
          squat: 150,
          deadlift: 200,
          overheadPress: 60,
        });

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 全ての種目が返る
        expect(result).toEqual({
          benchPress: 100,
          squat: 150,
          deadlift: 200,
          overheadPress: 60,
        });
      });
    });

    describe("正常系: キャッシュなし", () => {
      it("キャッシュがない場合、空オブジェクトを返す", () => {
        // Given: キャッシュなし
        // (localStorageMockは空)

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });

      it("バージョンキーのみある場合、空オブジェクトを返す", () => {
        // Given: バージョンのみ
        localStorageMock["max_weights_version_v2"] = "2";

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });
    });

    describe("正常系: SSR環境", () => {
      it("windowが未定義の場合、空オブジェクトを返す", () => {
        // Given: SSR環境（windowなし）
        const originalWindow = global.window;
        // @ts-expect-error - windowを一時的に削除
        delete global.window;

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト
        expect(result).toEqual({});

        // クリーンアップ
        global.window = originalWindow;
      });
    });

    describe("異常系: バージョン不一致", () => {
      it("バージョンが異なる場合、空オブジェクトを返す", () => {
        // Given: 古いバージョン
        localStorageMock["max_weights_version_v2"] = "1";
        localStorageMock["max_weights_cache_v2"] = JSON.stringify({
          ex1: 100,
        });

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });

      it("バージョンが文字列の場合、空オブジェクトを返す", () => {
        // Given: バージョンが文字列
        localStorageMock["max_weights_version_v2"] = "abc";
        localStorageMock["max_weights_cache_v2"] = JSON.stringify({
          ex1: 100,
        });

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });

      it("バージョンキーがない場合、空オブジェクトを返す", () => {
        // Given: バージョンキーなし
        localStorageMock["max_weights_cache_v2"] = JSON.stringify({
          ex1: 100,
        });

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });
    });

    describe("異常系: 無効なJSON", () => {
      it("不正なJSONの場合、空オブジェクトを返す", () => {
        // Given: 不正なJSON
        localStorageMock["max_weights_version_v2"] = "2";
        localStorageMock["max_weights_cache_v2"] = "{ invalid json }";

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト（エラーをキャッチ）
        expect(result).toEqual({});
      });
    });

    describe("異常系: 無効な型", () => {
      it("配列の場合、配列がそのまま返される（型ガードでは配列もobject）", () => {
        // Given: 配列
        localStorageMock["max_weights_version_v2"] = "2";
        localStorageMock["max_weights_cache_v2"] = JSON.stringify([100, 150]);

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 配列がそのまま返される（実装上の制限）
        expect(result).toEqual([100, 150]);
      });

      it("nullの場合、空オブジェクトを返す", () => {
        // Given: null
        localStorageMock["max_weights_version_v2"] = "2";
        localStorageMock["max_weights_cache_v2"] = JSON.stringify(null);

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });

      it("文字列の場合、空オブジェクトを返す", () => {
        // Given: 文字列
        localStorageMock["max_weights_version_v2"] = "2";
        localStorageMock["max_weights_cache_v2"] = JSON.stringify("string");

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });

      it("数値の場合、空オブジェクトを返す", () => {
        // Given: 数値
        localStorageMock["max_weights_version_v2"] = "2";
        localStorageMock["max_weights_cache_v2"] = JSON.stringify(123);

        // When: キャッシュをロード
        const result = loadMaxWeightsCache();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });
    });
  });

  describe("saveMaxWeightsCache", () => {
    describe("正常系: 保存成功", () => {
      it("有効なデータを保存する", () => {
        // Given: 有効なデータ
        const maxWeights: MaxWeightsMap = {
          ex1: 100,
          ex2: 150,
        };

        // When: キャッシュを保存
        saveMaxWeightsCache(maxWeights);

        // Then: localStorageに保存される
        expect(setItemSpy).toHaveBeenCalledWith(
          "max_weights_cache_v2",
          JSON.stringify(maxWeights)
        );
        expect(setItemSpy).toHaveBeenCalledWith("max_weights_version_v2", "2");
      });

      it("空オブジェクトを保存する", () => {
        // Given: 空オブジェクト
        const maxWeights: MaxWeightsMap = {};

        // When: キャッシュを保存
        saveMaxWeightsCache(maxWeights);

        // Then: localStorageに保存される
        expect(setItemSpy).toHaveBeenCalledWith(
          "max_weights_cache_v2",
          JSON.stringify(maxWeights)
        );
      });

      it("複数の種目を保存する", () => {
        // Given: 複数種目のデータ
        const maxWeights: MaxWeightsMap = {
          benchPress: 100,
          squat: 150,
          deadlift: 200,
        };

        // When: キャッシュを保存
        saveMaxWeightsCache(maxWeights);

        // Then: localStorageに保存される
        expect(localStorageMock["max_weights_cache_v2"]).toBe(
          JSON.stringify(maxWeights)
        );
        expect(localStorageMock["max_weights_version_v2"]).toBe("2");
      });
    });

    describe("正常系: SSR環境", () => {
      it("windowが未定義の場合、エラーなく終了する", () => {
        // Given: SSR環境（windowなし）
        const originalWindow = global.window;
        // @ts-expect-error - windowを一時的に削除
        delete global.window;

        const maxWeights: MaxWeightsMap = { ex1: 100 };

        // When: キャッシュを保存
        // Then: エラーが発生しない
        expect(() => saveMaxWeightsCache(maxWeights)).not.toThrow();

        // クリーンアップ
        global.window = originalWindow;
      });
    });

    describe("異常系: 保存失敗", () => {
      it("setItemが失敗してもエラーを投げない", () => {
        // Given: setItemが失敗する
        setItemSpy.mockImplementation(() => {
          throw new Error("QuotaExceededError");
        });

        const maxWeights: MaxWeightsMap = { ex1: 100 };

        // When: キャッシュを保存
        // Then: エラーが発生しない
        expect(() => saveMaxWeightsCache(maxWeights)).not.toThrow();
      });
    });
  });

  describe("calculateMaxWeightsFromStorage", () => {
    describe("正常系: 単一種目", () => {
      it("1種目の記録から最大重量を計算する", () => {
        // Given: 1種目の記録
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { weight: 100, reps: 10 },
          { weight: 105, reps: 8 },
          { weight: 110, reps: 6 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 最大重量が返る
        expect(result).toEqual({
          ex1: 110,
        });
      });
    });

    describe("正常系: 複数種目", () => {
      it("複数種目の記録から各種目の最大重量を計算する", () => {
        // Given: 複数種目の記録
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { weight: 100, reps: 10 },
        ]);
        localStorageMock["workout_2024-01-01_ex2"] = JSON.stringify([
          { weight: 150, reps: 10 },
        ]);
        localStorageMock["workout_2024-01-01_ex3"] = JSON.stringify([
          { weight: 200, reps: 10 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 各種目の最大重量が返る
        expect(result).toEqual({
          ex1: 100,
          ex2: 150,
          ex3: 200,
        });
      });
    });

    describe("正常系: 同じ種目の複数日記録", () => {
      it("同じ種目の複数日記録から最大値を取得する", () => {
        // Given: 同じ種目の複数日記録
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { weight: 100, reps: 10 },
        ]);
        localStorageMock["workout_2024-01-02_ex1"] = JSON.stringify([
          { weight: 105, reps: 10 },
        ]);
        localStorageMock["workout_2024-01-03_ex1"] = JSON.stringify([
          { weight: 110, reps: 10 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 最大値が返る
        expect(result).toEqual({
          ex1: 110,
        });
      });

      it("後の日付の方が軽い場合でも最大値を保持する", () => {
        // Given: 後の日付の方が軽い
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { weight: 110, reps: 10 },
        ]);
        localStorageMock["workout_2024-01-02_ex1"] = JSON.stringify([
          { weight: 105, reps: 10 },
        ]);
        localStorageMock["workout_2024-01-03_ex1"] = JSON.stringify([
          { weight: 100, reps: 10 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 最大値（110）が返る
        expect(result).toEqual({
          ex1: 110,
        });
      });
    });

    describe("正常系: 文字列の重量", () => {
      it("重量が文字列の場合、数値に変換する", () => {
        // Given: 重量が文字列
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { weight: "100", reps: 10 },
          { weight: "105", reps: 8 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 数値に変換されて最大値が返る
        expect(result).toEqual({
          ex1: 105,
        });
      });

      it("小数の文字列も正しく変換する", () => {
        // Given: 小数の文字列
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { weight: "100.5", reps: 10 },
          { weight: "105.5", reps: 8 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 小数に変換されて最大値が返る
        expect(result).toEqual({
          ex1: 105.5,
        });
      });
    });

    describe("正常系: SSR環境", () => {
      it("windowが未定義の場合、空オブジェクトを返す", () => {
        // Given: SSR環境（windowなし）
        const originalWindow = global.window;
        // @ts-expect-error - windowを一時的に削除
        delete global.window;

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 空オブジェクト
        expect(result).toEqual({});

        // クリーンアップ
        global.window = originalWindow;
      });
    });

    describe("異常系: 無効なキー", () => {
      it("workout_で始まらないキーはスキップする", () => {
        // Given: 無効なキー
        localStorageMock["invalid_key"] = JSON.stringify([
          { weight: 100, reps: 10 },
        ]);
        localStorageMock["cardio_2024-01-01_ex1"] = JSON.stringify([
          { weight: 100, reps: 10 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });

      it("キーの形式が不正な場合はスキップする", () => {
        // Given: 形式が不正なキー
        localStorageMock["workout_"] = JSON.stringify([
          { weight: 100, reps: 10 },
        ]);
        localStorageMock["workout_2024-01-01"] = JSON.stringify([
          { weight: 100, reps: 10 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });
    });

    describe("異常系: 無効なJSON", () => {
      it("不正なJSONの場合はスキップする", () => {
        // Given: 不正なJSON
        localStorageMock["workout_2024-01-01_ex1"] = "{ invalid json }";
        localStorageMock["workout_2024-01-01_ex2"] = JSON.stringify([
          { weight: 150, reps: 10 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 有効なデータのみ（ex2のみ）
        expect(result).toEqual({
          ex2: 150,
        });
      });
    });

    describe("異常系: 配列でない", () => {
      it("配列でない場合はスキップする", () => {
        // Given: 配列でないデータ
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify({
          weight: 100,
          reps: 10,
        });
        localStorageMock["workout_2024-01-01_ex2"] = JSON.stringify([
          { weight: 150, reps: 10 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 有効なデータのみ（ex2のみ）
        expect(result).toEqual({
          ex2: 150,
        });
      });
    });

    describe("異常系: weightプロパティなし", () => {
      it("weightプロパティがない場合はスキップする", () => {
        // Given: weightなしのデータ
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { reps: 10 },
          { reps: 8 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 空オブジェクト（有効なweightがない）
        expect(result).toEqual({});
      });

      it("一部だけweightがある場合、有効な値のみを使用する", () => {
        // Given: 一部だけweightあり
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { reps: 10 },
          { weight: 105, reps: 8 },
          { reps: 6 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 有効な値（105）
        expect(result).toEqual({
          ex1: 105,
        });
      });

      it("weightがNaNの文字列の場合はスキップする", () => {
        // Given: NaNの文字列
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { weight: "abc", reps: 10 },
          { weight: 100, reps: 8 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 有効な値（100）のみ
        expect(result).toEqual({
          ex1: 100,
        });
      });
    });

    describe("正常系: 空のlocalStorage", () => {
      it("localStorageが空の場合、空オブジェクトを返す", () => {
        // Given: 空のlocalStorage
        // (localStorageMockは空)

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });
    });

    describe("カバレッジ向上: エッジケース", () => {
      it("localStorage.key(i)がnullを返す場合はスキップする", () => {
        // Given: keyメソッドがnullを返す
        keySpy.mockReturnValue(null);
        lengthGetter.mockReturnValue(1);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });

      it("getItemがnullを返す場合はスキップする", () => {
        // Given: getItemがnullを返す
        localStorageMock["workout_2024-01-01_ex1"] = "";
        getItemSpy.mockReturnValue(null);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 空オブジェクト
        expect(result).toEqual({});
      });

      it("セットがnullの場合はスキップする", () => {
        // Given: セットがnull
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          null,
          { weight: 100, reps: 10 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 有効なセットのみ（100）
        expect(result).toEqual({
          ex1: 100,
        });
      });

      it("weightが文字列でNaNに変換される場合はスキップする", () => {
        // Given: weightが文字列でNaN
        localStorageMock["workout_2024-01-01_ex1"] = JSON.stringify([
          { weight: "not-a-number", reps: 10 },
          { weight: 100, reps: 8 },
        ]);

        // When: 最大重量を計算
        const result = calculateMaxWeightsFromStorage();

        // Then: 有効な値（100）のみ
        expect(result).toEqual({
          ex1: 100,
        });
      });
    });
  });
});
