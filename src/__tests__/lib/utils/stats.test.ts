/**
 * グラフ機能用ユーティリティ関数のテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getStartDate,
  extractMaxWeightUpdates,
  identifyBig3Exercises,
  mergeProgressData,
  toNumber,
  calculateDayMaxWeight,
} from "@/lib/utils/stats";
import type { DateRangePreset } from "@/types/stats";

describe("getStartDate", () => {
  let mockNow: Date;

  beforeEach(() => {
    // 2024-01-15 12:00:00を基準日時とする
    mockNow = new Date("2024-01-15T12:00:00Z");
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("正常系: 各プリセット", () => {
    it('"week"の場合、7日前の日付を返す', () => {
      // Given: プリセット"week"
      const preset: DateRangePreset = "week";

      // When: 開始日を取得
      const result = getStartDate(preset);

      // Then: 7日前の日付（2024-01-08）
      const expected = new Date("2024-01-08T12:00:00Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    it('"month"の場合、1ヶ月前の日付を返す', () => {
      // Given: プリセット"month"
      const preset: DateRangePreset = "month";

      // When: 開始日を取得
      const result = getStartDate(preset);

      // Then: 1ヶ月前の日付（2023-12-15）
      const expected = new Date("2023-12-15T12:00:00Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    it('"3months"の場合、3ヶ月前の日付を返す', () => {
      // Given: プリセット"3months"
      const preset: DateRangePreset = "3months";

      // When: 開始日を取得
      const result = getStartDate(preset);

      // Then: 3ヶ月前の日付（2023-10-15）
      const expected = new Date("2023-10-15T12:00:00Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    it('"6months"の場合、6ヶ月前の日付を返す', () => {
      // Given: プリセット"6months"
      const preset: DateRangePreset = "6months";

      // When: 開始日を取得
      const result = getStartDate(preset);

      // Then: 6ヶ月前の日付（2023-07-15）
      const expected = new Date("2023-07-15T12:00:00Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    it('"year"の場合、1年前の日付を返す', () => {
      // Given: プリセット"year"
      const preset: DateRangePreset = "year";

      // When: 開始日を取得
      const result = getStartDate(preset);

      // Then: 1年前の日付（2023-01-15）
      const expected = new Date("2023-01-15T12:00:00Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    it('"all"の場合、1970-01-01を返す', () => {
      // Given: プリセット"all"
      const preset: DateRangePreset = "all";

      // When: 開始日を取得
      const result = getStartDate(preset);

      // Then: 1970-01-01
      const expected = new Date(0);
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    it("未定義のプリセットの場合、1ヶ月前を返す（defaultケース）", () => {
      // Given: 未定義のプリセット（型アサーションで強制）
      const preset = "unknown" as DateRangePreset;

      // When: 開始日を取得
      const result = getStartDate(preset);

      // Then: 1ヶ月前の日付（defaultケース）
      const expected = new Date("2023-12-15T12:00:00Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });
  });
});

describe("extractMaxWeightUpdates", () => {
  describe("正常系: 空配列", () => {
    it("空配列の場合、空配列を返す", () => {
      // Given: 空配列
      const data: Array<{ date: string; maxWeight: number | string }> = [];

      // When: 最大重量の更新を抽出
      const result = extractMaxWeightUpdates(data);

      // Then: 空配列
      expect(result).toEqual([]);
    });
  });

  describe("正常系: 単一記録", () => {
    it("1件の記録の場合、その記録を返す", () => {
      // Given: 1件のみの記録
      const data = [{ date: "2024-01-01", maxWeight: 100 }];

      // When: 最大重量の更新を抽出
      const result = extractMaxWeightUpdates(data);

      // Then: その記録が返る
      expect(result).toEqual([{ date: "2024-01-01", maxWeight: 100 }]);
    });
  });

  describe("正常系: 更新あり", () => {
    it("最大重量が更新された記録のみを抽出する", () => {
      // Given: 最大重量が更新される記録
      const data = [
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 105 }, // 更新
        { date: "2024-01-03", maxWeight: 105 }, // 更新なし
        { date: "2024-01-04", maxWeight: 110 }, // 更新
        { date: "2024-01-05", maxWeight: 108 }, // 下がったので更新なし
      ];

      // When: 最大重量の更新を抽出
      const result = extractMaxWeightUpdates(data);

      // Then: 更新された記録のみ
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 105 },
        { date: "2024-01-04", maxWeight: 110 },
      ]);
    });
  });

  describe("正常系: 更新なし", () => {
    it("同じ重量が続く場合、最初の記録のみを返す", () => {
      // Given: 同じ重量が続く記録
      const data = [
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 100 },
        { date: "2024-01-03", maxWeight: 100 },
      ];

      // When: 最大重量の更新を抽出
      const result = extractMaxWeightUpdates(data);

      // Then: 最初の記録のみ
      expect(result).toEqual([{ date: "2024-01-01", maxWeight: 100 }]);
    });
  });

  describe("正常系: 文字列の重量", () => {
    it("重量が文字列の場合、数値に変換して処理する", () => {
      // Given: 重量が文字列の記録
      const data = [
        { date: "2024-01-01", maxWeight: "100" },
        { date: "2024-01-02", maxWeight: "105" },
        { date: "2024-01-03", maxWeight: "110.5" },
      ];

      // When: 最大重量の更新を抽出
      const result = extractMaxWeightUpdates(data);

      // Then: 文字列が数値に変換されて処理される
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 105 },
        { date: "2024-01-03", maxWeight: 110.5 },
      ]);
    });
  });

  describe("異常系: 無効な値", () => {
    it("NaNの重量はスキップされる", () => {
      // Given: NaNを含む記録
      const data = [
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: NaN },
        { date: "2024-01-03", maxWeight: 110 },
      ];

      // When: 最大重量の更新を抽出
      const result = extractMaxWeightUpdates(data);

      // Then: NaNはスキップされる
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-03", maxWeight: 110 },
      ]);
    });

    it("負の重量はスキップされる", () => {
      // Given: 負の数を含む記録
      const data = [
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: -10 },
        { date: "2024-01-03", maxWeight: 110 },
      ];

      // When: 最大重量の更新を抽出
      const result = extractMaxWeightUpdates(data);

      // Then: 負の数はスキップされる
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-03", maxWeight: 110 },
      ]);
    });

    it("0の重量はスキップされる", () => {
      // Given: 0を含む記録
      const data = [
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 0 },
        { date: "2024-01-03", maxWeight: 110 },
      ];

      // When: 最大重量の更新を抽出
      const result = extractMaxWeightUpdates(data);

      // Then: 0はスキップされる
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-03", maxWeight: 110 },
      ]);
    });

    it("数値変換できない文字列はスキップされる", () => {
      // Given: 数値変換できない文字列を含む記録
      const data = [
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: "abc" },
        { date: "2024-01-03", maxWeight: 110 },
      ];

      // When: 最大重量の更新を抽出
      const result = extractMaxWeightUpdates(data);

      // Then: 変換できない文字列はスキップされる
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-03", maxWeight: 110 },
      ]);
    });
  });
});

describe("identifyBig3Exercises", () => {
  describe("正常系: Big3全て存在", () => {
    it("Big3全ての種目がある場合、全てのIDを返す", () => {
      // Given: Big3全ての種目
      const exercises = [
        { id: "ex1", name: "ベンチプレス" },
        { id: "ex2", name: "スクワット" },
        { id: "ex3", name: "デッドリフト" },
      ];

      // When: Big3種目を特定
      const result = identifyBig3Exercises(exercises);

      // Then: 全てのIDが返る
      expect(result).toEqual({
        benchPressId: "ex1",
        squatId: "ex2",
        deadliftId: "ex3",
      });
    });
  });

  describe("正常系: 一部のみ存在", () => {
    it("ベンチプレスのみの場合、ベンチプレスのIDのみ返す", () => {
      // Given: ベンチプレスのみ
      const exercises = [
        { id: "ex1", name: "ベンチプレス" },
        { id: "ex2", name: "ショルダープレス" },
      ];

      // When: Big3種目を特定
      const result = identifyBig3Exercises(exercises);

      // Then: ベンチプレスのIDのみ
      expect(result).toEqual({
        benchPressId: "ex1",
        squatId: undefined,
        deadliftId: undefined,
      });
    });

    it("スクワットとデッドリフトのみの場合、それらのIDのみ返す", () => {
      // Given: スクワットとデッドリフト
      const exercises = [
        { id: "ex1", name: "バックスクワット" },
        { id: "ex2", name: "コンベンショナルデッドリフト" },
        { id: "ex3", name: "レッグプレス" },
      ];

      // When: Big3種目を特定
      const result = identifyBig3Exercises(exercises);

      // Then: スクワットとデッドリフトのIDのみ
      expect(result).toEqual({
        benchPressId: undefined,
        squatId: "ex1",
        deadliftId: "ex2",
      });
    });
  });

  describe("正常系: 空配列", () => {
    it("空配列の場合、全てundefinedを返す", () => {
      // Given: 空配列
      const exercises: Array<{ id: string; name: string }> = [];

      // When: Big3種目を特定
      const result = identifyBig3Exercises(exercises);

      // Then: 全てundefined
      expect(result).toEqual({
        benchPressId: undefined,
        squatId: undefined,
        deadliftId: undefined,
      });
    });
  });

  describe("正常系: Big3以外の種目のみ", () => {
    it("Big3以外の種目のみの場合、全てundefinedを返す", () => {
      // Given: Big3以外の種目のみ
      const exercises = [
        { id: "ex1", name: "ショルダープレス" },
        { id: "ex2", name: "レッグプレス" },
        { id: "ex3", name: "ラットプルダウン" },
      ];

      // When: Big3種目を特定
      const result = identifyBig3Exercises(exercises);

      // Then: 全てundefined
      expect(result).toEqual({
        benchPressId: undefined,
        squatId: undefined,
        deadliftId: undefined,
      });
    });
  });

  describe("正常系: 部分一致で判定", () => {
    it("種目名に「ベンチプレス」が含まれる場合、マッチする", () => {
      // Given: 「ベンチプレス」を含む種目名
      const exercises = [
        { id: "ex1", name: "インクラインベンチプレス" },
        { id: "ex2", name: "フラットベンチプレス" },
      ];

      // When: Big3種目を特定
      const result = identifyBig3Exercises(exercises);

      // Then: 最初にマッチした種目のID
      expect(result.benchPressId).toBe("ex1");
    });
  });
});

describe("mergeProgressData", () => {
  describe("正常系: 重複なし", () => {
    it("異なる日付のデータは全てマージされる", () => {
      // Given: 重複なしのデータ
      const dbData = [
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 105 },
      ];
      const storageData = [
        { date: "2024-01-03", maxWeight: 110 },
        { date: "2024-01-04", maxWeight: 115 },
      ];

      // When: データをマージ
      const result = mergeProgressData(dbData, storageData);

      // Then: 全てのデータがマージされる
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 105 },
        { date: "2024-01-03", maxWeight: 110 },
        { date: "2024-01-04", maxWeight: 115 },
      ]);
    });
  });

  describe("正常系: 重複あり", () => {
    it("同じ日付でDBの方が大きい場合、DBの値を採用する", () => {
      // Given: 同じ日付でDB > storage
      const dbData = [
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 110 }, // DBの方が大きい
      ];
      const storageData = [
        { date: "2024-01-02", maxWeight: 105 },
        { date: "2024-01-03", maxWeight: 115 },
      ];

      // When: データをマージ
      const result = mergeProgressData(dbData, storageData);

      // Then: DBの値が採用される
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 110 }, // DBの値
        { date: "2024-01-03", maxWeight: 115 },
      ]);
    });

    it("同じ日付でstorageの方が大きい場合、storageの値を採用する", () => {
      // Given: 同じ日付でstorage > DB
      const dbData = [
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 105 }, // DBの方が小さい
      ];
      const storageData = [
        { date: "2024-01-02", maxWeight: 110 },
        { date: "2024-01-03", maxWeight: 115 },
      ];

      // When: データをマージ
      const result = mergeProgressData(dbData, storageData);

      // Then: storageの値が採用される
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 110 }, // storageの値
        { date: "2024-01-03", maxWeight: 115 },
      ]);
    });

    it("同じ日付で同じ値の場合、どちらでもOK", () => {
      // Given: 同じ日付で同じ値
      const dbData = [{ date: "2024-01-01", maxWeight: 100 }];
      const storageData = [{ date: "2024-01-01", maxWeight: 100 }];

      // When: データをマージ
      const result = mergeProgressData(dbData, storageData);

      // Then: 同じ値が1つ
      expect(result).toEqual([{ date: "2024-01-01", maxWeight: 100 }]);
    });
  });

  describe("正常系: ソート", () => {
    it("日付順にソートされる", () => {
      // Given: ランダムな日付順のデータ
      const dbData = [
        { date: "2024-01-03", maxWeight: 110 },
        { date: "2024-01-01", maxWeight: 100 },
      ];
      const storageData = [
        { date: "2024-01-04", maxWeight: 115 },
        { date: "2024-01-02", maxWeight: 105 },
      ];

      // When: データをマージ
      const result = mergeProgressData(dbData, storageData);

      // Then: 日付順にソートされる
      expect(result).toEqual([
        { date: "2024-01-01", maxWeight: 100 },
        { date: "2024-01-02", maxWeight: 105 },
        { date: "2024-01-03", maxWeight: 110 },
        { date: "2024-01-04", maxWeight: 115 },
      ]);
    });
  });

  describe("正常系: 空配列", () => {
    it("両方空配列の場合、空配列を返す", () => {
      // Given: 両方空配列
      const dbData: Array<{ date: string; maxWeight: number }> = [];
      const storageData: Array<{ date: string; maxWeight: number }> = [];

      // When: データをマージ
      const result = mergeProgressData(dbData, storageData);

      // Then: 空配列
      expect(result).toEqual([]);
    });

    it("DBのみデータがある場合、DBのデータを返す", () => {
      // Given: DBのみデータあり
      const dbData = [{ date: "2024-01-01", maxWeight: 100 }];
      const storageData: Array<{ date: string; maxWeight: number }> = [];

      // When: データをマージ
      const result = mergeProgressData(dbData, storageData);

      // Then: DBのデータ
      expect(result).toEqual([{ date: "2024-01-01", maxWeight: 100 }]);
    });

    it("storageのみデータがある場合、storageのデータを返す", () => {
      // Given: storageのみデータあり
      const dbData: Array<{ date: string; maxWeight: number }> = [];
      const storageData = [{ date: "2024-01-01", maxWeight: 100 }];

      // When: データをマージ
      const result = mergeProgressData(dbData, storageData);

      // Then: storageのデータ
      expect(result).toEqual([{ date: "2024-01-01", maxWeight: 100 }]);
    });
  });
});

describe("toNumber", () => {
  describe("正常系: 数値", () => {
    it("数値の場合、そのまま返す", () => {
      // Given: 数値
      const value = 100;

      // When: 数値に変換
      const result = toNumber(value);

      // Then: そのまま返る
      expect(result).toBe(100);
    });

    it("小数の場合、そのまま返す", () => {
      // Given: 小数
      const value = 10.5;

      // When: 数値に変換
      const result = toNumber(value);

      // Then: そのまま返る
      expect(result).toBe(10.5);
    });

    it("0の場合、0を返す", () => {
      // Given: 0
      const value = 0;

      // When: 数値に変換
      const result = toNumber(value);

      // Then: 0
      expect(result).toBe(0);
    });

    it("負の数の場合、そのまま返す", () => {
      // Given: 負の数
      const value = -10;

      // When: 数値に変換
      const result = toNumber(value);

      // Then: そのまま返る
      expect(result).toBe(-10);
    });
  });

  describe("正常系: 文字列の数値", () => {
    it("数値文字列の場合、数値に変換する", () => {
      // Given: 数値文字列
      const value = "100";

      // When: 数値に変換
      const result = toNumber(value);

      // Then: 数値に変換される
      expect(result).toBe(100);
    });

    it("小数の文字列の場合、小数に変換する", () => {
      // Given: 小数の文字列
      const value = "10.5";

      // When: 数値に変換
      const result = toNumber(value);

      // Then: 小数に変換される
      expect(result).toBe(10.5);
    });

    it("負の数の文字列の場合、負の数に変換する", () => {
      // Given: 負の数の文字列
      const value = "-10";

      // When: 数値に変換
      const result = toNumber(value);

      // Then: 負の数に変換される
      expect(result).toBe(-10);
    });
  });

  describe("正常系: null/undefined", () => {
    it("nullの場合、nullを返す", () => {
      // Given: null
      const value = null;

      // When: 数値に変換
      const result = toNumber(value);

      // Then: null
      expect(result).toBeNull();
    });

    it("undefinedの場合、nullを返す", () => {
      // Given: undefined
      const value = undefined;

      // When: 数値に変換
      const result = toNumber(value);

      // Then: null
      expect(result).toBeNull();
    });
  });

  describe("異常系: 数値変換不可", () => {
    it("数値変換できない文字列の場合、nullを返す", () => {
      // Given: 数値変換できない文字列
      const value = "abc";

      // When: 数値に変換
      const result = toNumber(value);

      // Then: null
      expect(result).toBeNull();
    });

    it("オブジェクトの場合、nullを返す", () => {
      // Given: オブジェクト
      const value = { foo: "bar" };

      // When: 数値に変換
      const result = toNumber(value);

      // Then: null
      expect(result).toBeNull();
    });

    it("配列の場合、nullを返す", () => {
      // Given: 配列
      const value = [1, 2, 3];

      // When: 数値に変換
      const result = toNumber(value);

      // Then: null
      expect(result).toBeNull();
    });

    it("真偽値の場合、nullを返す", () => {
      // Given: 真偽値
      const value = true;

      // When: 数値に変換
      const result = toNumber(value);

      // Then: null
      expect(result).toBeNull();
    });
  });
});

describe("calculateDayMaxWeight", () => {
  describe("正常系: 通常セット", () => {
    it("複数セットの場合、最大重量を返す", () => {
      // Given: 複数のセット
      const sets = [
        { weight: 100, isWarmup: false },
        { weight: 110, isWarmup: false },
        { weight: 105, isWarmup: false },
      ];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: 最大重量（110kg）
      expect(result).toBe(110);
    });
  });

  describe("正常系: ウォームアップセット", () => {
    it("ウォームアップセットは除外される", () => {
      // Given: ウォームアップセットを含むセット
      const sets = [
        { weight: 60, isWarmup: true }, // ウォームアップ
        { weight: 80, isWarmup: true }, // ウォームアップ
        { weight: 100, isWarmup: false },
        { weight: 110, isWarmup: false },
      ];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: ウォームアップを除く最大重量（110kg）
      expect(result).toBe(110);
    });

    it("全てウォームアップの場合、0を返す", () => {
      // Given: 全てウォームアップ
      const sets = [
        { weight: 60, isWarmup: true },
        { weight: 80, isWarmup: true },
      ];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: 0
      expect(result).toBe(0);
    });
  });

  describe("正常系: 空配列", () => {
    it("空配列の場合、0を返す", () => {
      // Given: 空配列
      const sets: Array<{ weight?: number | null; isWarmup?: boolean }> = [];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: 0
      expect(result).toBe(0);
    });
  });

  describe("正常系: 単一セット", () => {
    it("1セットのみの場合、その重量を返す", () => {
      // Given: 1セットのみ
      const sets = [{ weight: 100, isWarmup: false }];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: その重量（100kg）
      expect(result).toBe(100);
    });
  });

  describe("異常系: 無効な重量", () => {
    it("weightがnullの場合、スキップされる", () => {
      // Given: weightがnull
      const sets = [
        { weight: 100, isWarmup: false },
        { weight: null, isWarmup: false },
        { weight: 110, isWarmup: false },
      ];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: nullはスキップされ、110kgが最大
      expect(result).toBe(110);
    });

    it("weightがundefinedの場合、スキップされる", () => {
      // Given: weightがundefined
      const sets = [
        { weight: 100, isWarmup: false },
        { weight: undefined, isWarmup: false },
        { weight: 110, isWarmup: false },
      ];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: undefinedはスキップされ、110kgが最大
      expect(result).toBe(110);
    });

    it("weightが0の場合、スキップされる", () => {
      // Given: weightが0
      const sets = [
        { weight: 100, isWarmup: false },
        { weight: 0, isWarmup: false },
        { weight: 110, isWarmup: false },
      ];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: 0はスキップされ、110kgが最大
      expect(result).toBe(110);
    });

    it("weightが負の数の場合、スキップされる", () => {
      // Given: weightが負の数
      const sets = [
        { weight: 100, isWarmup: false },
        { weight: -10, isWarmup: false },
        { weight: 110, isWarmup: false },
      ];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: 負の数はスキップされ、110kgが最大
      expect(result).toBe(110);
    });

    it("全てのセットが無効な場合、0を返す", () => {
      // Given: 全て無効なセット
      const sets = [
        { weight: null, isWarmup: false },
        { weight: 0, isWarmup: false },
        { weight: -10, isWarmup: false },
      ];

      // When: その日の最大重量を計算
      const result = calculateDayMaxWeight(sets);

      // Then: 0
      expect(result).toBe(0);
    });
  });
});
