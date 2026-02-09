import { describe, it, expect } from "vitest";
import {
  calculateBMI,
  getBMICategory,
  getBMIResult,
  getBMIPercentage,
} from "@/lib/utils/bmi";

describe("calculateBMI", () => {
  describe("正常系", () => {
    it("[TC-N-01] 標準的な体型（170cm, 70kg）でBMI=24.2を返す", () => {
      // Given: 身長170cm、体重70kgの標準的な体型
      const height = 170;
      const weight = 70;

      // When: BMIを計算
      const result = calculateBMI(height, weight);

      // Then: BMI=24.2が返される
      expect(result).toBe(24.2);
    });

    it("[TC-N-02] 大柄な体型（180cm, 80kg）でBMI=24.7を返す", () => {
      // Given: 身長180cm、体重80kgの大柄な体型
      const height = 180;
      const weight = 80;

      // When: BMIを計算
      const result = calculateBMI(height, weight);

      // Then: BMI=24.7が返される
      expect(result).toBe(24.7);
    });

    it("[TC-N-03] 小数点を含む入力（175.5cm, 65.5kg）で正しく計算される", () => {
      // Given: 小数点を含む身長・体重
      const height = 175.5;
      const weight = 65.5;

      // When: BMIを計算
      const result = calculateBMI(height, weight);

      // Then: BMI=21.3が返される
      expect(result).toBe(21.3);
    });
  });

  describe("異常系・境界値", () => {
    it("[TC-A-01] 身長が0の場合、BMI=0を返す", () => {
      // Given: 身長が0
      const height = 0;
      const weight = 70;

      // When: BMIを計算
      const result = calculateBMI(height, weight);

      // Then: BMI=0が返される（エラー処理）
      expect(result).toBe(0);
    });

    it("[TC-A-02] 体重が0の場合、BMI=0を返す", () => {
      // Given: 体重が0
      const height = 170;
      const weight = 0;

      // When: BMIを計算
      const result = calculateBMI(height, weight);

      // Then: BMI=0が返される（エラー処理）
      expect(result).toBe(0);
    });

    it("[TC-A-03] 身長が負の値の場合、BMI=0を返す", () => {
      // Given: 身長が負の値
      const height = -10;
      const weight = 70;

      // When: BMIを計算
      const result = calculateBMI(height, weight);

      // Then: BMI=0が返される（エラー処理）
      expect(result).toBe(0);
    });

    it("[TC-A-04] 体重が負の値の場合、BMI=0を返す", () => {
      // Given: 体重が負の値
      const height = 170;
      const weight = -10;

      // When: BMIを計算
      const result = calculateBMI(height, weight);

      // Then: BMI=0が返される（エラー処理）
      expect(result).toBe(0);
    });

    it("[TC-A-05] 極端に小さい身長（1cm）で計算できる", () => {
      // Given: 極端に小さい身長
      const height = 1;
      const weight = 70;

      // When: BMIを計算
      const result = calculateBMI(height, weight);

      // Then: 大きなBMI値が返される
      expect(result).toBe(700000);
    });

    it("[TC-A-06] 極端に大きい値（300cm, 200kg）で計算できる", () => {
      // Given: 極端に大きい身長・体重
      const height = 300;
      const weight = 200;

      // When: BMIを計算
      const result = calculateBMI(height, weight);

      // Then: BMI=22.2が返される
      expect(result).toBe(22.2);
    });
  });
});

describe("getBMICategory", () => {
  describe("正常系", () => {
    it('[TC-N-01] BMI=22の場合、"normal"カテゴリを返す', () => {
      // Given: BMI=22（標準体重範囲）
      const bmi = 22;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: normalカテゴリが返される
      expect(result.category).toBe("normal");
      expect(result.categoryLabel).toBe("標準体重（健康的な範囲内）");
    });

    it('[TC-N-02] BMI=17の場合、"underweight"カテゴリを返す', () => {
      // Given: BMI=17（低体重範囲）
      const bmi = 17;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: underweightカテゴリが返される
      expect(result.category).toBe("underweight");
      expect(result.categoryLabel).toBe("低体重（やせ型）");
    });

    it('[TC-N-03] BMI=27の場合、"overweight"カテゴリを返す', () => {
      // Given: BMI=27（肥満1度範囲）
      const bmi = 27;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: overweightカテゴリが返される
      expect(result.category).toBe("overweight");
      expect(result.categoryLabel).toBe("肥満（1度）");
    });

    it('[TC-N-04] BMI=32の場合、"obese"カテゴリを返す', () => {
      // Given: BMI=32（肥満2度以上範囲）
      const bmi = 32;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: obeseカテゴリが返される
      expect(result.category).toBe("obese");
      expect(result.categoryLabel).toBe("肥満（2度以上）");
    });
  });

  describe("境界値テスト", () => {
    it('[TC-B-01] BMI=18.5の場合、"normal"カテゴリを返す（標準体重の下限）', () => {
      // Given: BMI=18.5（境界値）
      const bmi = 18.5;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: normalカテゴリが返される
      expect(result.category).toBe("normal");
    });

    it('[TC-B-02] BMI=18.4の場合、"underweight"カテゴリを返す（境界値-0.1）', () => {
      // Given: BMI=18.4（境界値-0.1）
      const bmi = 18.4;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: underweightカテゴリが返される
      expect(result.category).toBe("underweight");
    });

    it('[TC-B-03] BMI=25の場合、"overweight"カテゴリを返す（肥満1度の下限）', () => {
      // Given: BMI=25（境界値）
      const bmi = 25;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: overweightカテゴリが返される
      expect(result.category).toBe("overweight");
    });

    it('[TC-B-04] BMI=24.9の場合、"normal"カテゴリを返す（標準体重の上限）', () => {
      // Given: BMI=24.9（境界値-0.1）
      const bmi = 24.9;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: normalカテゴリが返される
      expect(result.category).toBe("normal");
    });

    it('[TC-B-05] BMI=30の場合、"obese"カテゴリを返す（肥満2度の下限）', () => {
      // Given: BMI=30（境界値）
      const bmi = 30;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: obeseカテゴリが返される
      expect(result.category).toBe("obese");
    });

    it('[TC-B-06] BMI=29.9の場合、"overweight"カテゴリを返す（肥満1度の上限）', () => {
      // Given: BMI=29.9（境界値-0.1）
      const bmi = 29.9;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: overweightカテゴリが返される
      expect(result.category).toBe("overweight");
    });
  });

  describe("異常系", () => {
    it('[TC-A-01] BMI=0の場合、"underweight"カテゴリを返す', () => {
      // Given: BMI=0
      const bmi = 0;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: underweightカテゴリが返される
      expect(result.category).toBe("underweight");
    });

    it('[TC-A-02] 負のBMI値（-5）の場合、"underweight"カテゴリを返す', () => {
      // Given: 負のBMI値
      const bmi = -5;

      // When: カテゴリを判定
      const result = getBMICategory(bmi);

      // Then: underweightカテゴリが返される
      expect(result.category).toBe("underweight");
    });
  });
});

describe("getBMIResult", () => {
  it("[TC-N-01] 身長・体重からBMI結果を正しく返す", () => {
    // Given: 身長170cm、体重70kg
    const height = 170;
    const weight = 70;

    // When: BMI結果を取得
    const result = getBMIResult(height, weight);

    // Then: BMI、カテゴリ、ラベルが正しく返される
    expect(result.bmi).toBe(24.2);
    expect(result.category).toBe("normal");
    expect(result.categoryLabel).toBe("標準体重（健康的な範囲内）");
  });

  it("[TC-N-02] 低体重の場合、正しいカテゴリを返す", () => {
    // Given: BMI=17.0になる身長・体重
    const height = 170;
    const weight = 49.1;

    // When: BMI結果を取得
    const result = getBMIResult(height, weight);

    // Then: underweightカテゴリが返される
    expect(result.bmi).toBe(17.0);
    expect(result.category).toBe("underweight");
  });

  it("[TC-A-01] 身長が0の場合、BMI=0で低体重カテゴリを返す", () => {
    // Given: 身長が0
    const height = 0;
    const weight = 70;

    // When: BMI結果を取得
    const result = getBMIResult(height, weight);

    // Then: BMI=0、underweightカテゴリが返される
    expect(result.bmi).toBe(0);
    expect(result.category).toBe("underweight");
  });
});

describe("getBMIPercentage", () => {
  describe("正常系", () => {
    it("[TC-N-01] BMI=22の場合、percentage=30を返す", () => {
      // Given: BMI=22（標準範囲内）
      const bmi = 22;

      // When: パーセンテージに変換
      const result = getBMIPercentage(bmi);

      // Then: percentage=30が返される
      expect(result).toBe(30);
    });

    it("[TC-N-02] BMI=24.25の場合、percentage=50を返す（中間値）", () => {
      // Given: BMI=24.25（18.5と30の中間）
      const bmi = 24.25;

      // When: パーセンテージに変換
      const result = getBMIPercentage(bmi);

      // Then: percentage=50が返される
      expect(result).toBe(50);
    });
  });

  describe("境界値テスト", () => {
    it("[TC-B-01] BMI=18.5の場合、percentage=0を返す（最小値）", () => {
      // Given: BMI=18.5（境界値）
      const bmi = 18.5;

      // When: パーセンテージに変換
      const result = getBMIPercentage(bmi);

      // Then: percentage=0が返される
      expect(result).toBe(0);
    });

    it("[TC-B-02] BMI=30の場合、percentage=100を返す（最大値）", () => {
      // Given: BMI=30（境界値）
      const bmi = 30;

      // When: パーセンテージに変換
      const result = getBMIPercentage(bmi);

      // Then: percentage=100が返される
      expect(result).toBe(100);
    });
  });

  describe("異常系", () => {
    it("[TC-A-01] BMI=10の場合、percentage=0を返す（最小値未満）", () => {
      // Given: BMI=10（最小値未満）
      const bmi = 10;

      // When: パーセンテージに変換
      const result = getBMIPercentage(bmi);

      // Then: percentage=0が返される
      expect(result).toBe(0);
    });

    it("[TC-A-02] BMI=40の場合、percentage=100を返す（最大値超過）", () => {
      // Given: BMI=40（最大値超過）
      const bmi = 40;

      // When: パーセンテージに変換
      const result = getBMIPercentage(bmi);

      // Then: percentage=100が返される
      expect(result).toBe(100);
    });
  });
});
