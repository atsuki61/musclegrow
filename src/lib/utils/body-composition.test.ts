/**
 * 体組成計算ユーティリティのテスト
 */

import { describe, it, expect } from "vitest";
import {
  isBodyCompositionValid,
  calculateBodyComposition,
} from "./body-composition";

describe("isBodyCompositionValid", () => {
  describe("正常系: 有効なデータ", () => {
    it("標準的な値の場合、trueを返す", () => {
      // Given: 標準的な体組成データ
      const weight = 70;
      const bodyFat = 15;
      const muscleMass = 30;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 有効と判定される
      expect(result).toBe(true);
    });

    it("体脂肪率が0%の場合、trueを返す", () => {
      // Given: 体脂肪率が0%
      const weight = 100;
      const bodyFat = 0;
      const muscleMass = 50;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 有効と判定される
      expect(result).toBe(true);
    });

    it("筋肉量が0kgの場合、trueを返す", () => {
      // Given: 筋肉量が0kg
      const weight = 100;
      const bodyFat = 20;
      const muscleMass = 0;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 有効と判定される
      expect(result).toBe(true);
    });

    it("体脂肪率が100%の場合、trueを返す", () => {
      // Given: 体脂肪率が100%
      const weight = 100;
      const bodyFat = 100;
      const muscleMass = 0;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 有効と判定される
      expect(result).toBe(true);
    });

    it("体脂肪量+筋肉量=体重の場合、trueを返す", () => {
      // Given: 体脂肪量+筋肉量が体重と等しい
      const weight = 100;
      const bodyFat = 20; // 20kg
      const muscleMass = 80;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 有効と判定される
      expect(result).toBe(true);
    });
  });

  describe("異常系: 体重の不正な値", () => {
    it("体重が0の場合、falseを返す", () => {
      // Given: 体重が0
      const weight = 0;
      const bodyFat = 15;
      const muscleMass = 30;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 無効と判定される
      expect(result).toBe(false);
    });

    it("体重が負の数の場合、falseを返す", () => {
      // Given: 体重が負の数
      const weight = -10;
      const bodyFat = 15;
      const muscleMass = 30;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 無効と判定される
      expect(result).toBe(false);
    });
  });

  describe("異常系: 体脂肪率の不正な値", () => {
    it("体脂肪率が負の数の場合、falseを返す", () => {
      // Given: 体脂肪率が負の数
      const weight = 70;
      const bodyFat = -1;
      const muscleMass = 30;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 無効と判定される
      expect(result).toBe(false);
    });

    it("体脂肪率が100を超える場合、falseを返す", () => {
      // Given: 体脂肪率が100超
      const weight = 70;
      const bodyFat = 101;
      const muscleMass = 30;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 無効と判定される
      expect(result).toBe(false);
    });

    it("体脂肪率が100.1の場合、falseを返す（境界値+0.1）", () => {
      // Given: 体脂肪率が境界値+0.1
      const weight = 70;
      const bodyFat = 100.1;
      const muscleMass = 30;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 無効と判定される
      expect(result).toBe(false);
    });
  });

  describe("異常系: 筋肉量の不正な値", () => {
    it("筋肉量が負の数の場合、falseを返す", () => {
      // Given: 筋肉量が負の数
      const weight = 70;
      const bodyFat = 15;
      const muscleMass = -5;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 無効と判定される
      expect(result).toBe(false);
    });
  });

  describe("異常系: 体脂肪量+筋肉量が体重を超える", () => {
    it("体脂肪量+筋肉量が体重を超える場合、falseを返す", () => {
      // Given: 体脂肪量(30kg)+筋肉量(80kg) > 体重(100kg)
      const weight = 100;
      const bodyFat = 30; // 30kg
      const muscleMass = 80;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 無効と判定される
      expect(result).toBe(false);
    });

    it("体脂肪量+筋肉量が体重を僅かに超える場合、falseを返す（境界値+0.1）", () => {
      // Given: 体脂肪量+筋肉量が体重を0.1kg超える
      const weight = 100;
      const bodyFat = 20; // 20kg
      const muscleMass = 80.1;

      // When: バリデーションを実行
      const result = isBodyCompositionValid(weight, bodyFat, muscleMass);

      // Then: 無効と判定される
      expect(result).toBe(false);
    });
  });
});

describe("calculateBodyComposition", () => {
  describe("正常系: 標準的な計算", () => {
    it("標準的な値で正しく計算する", () => {
      // Given: 標準的な体組成データ（体重70kg、体脂肪率15%、筋肉量30kg）
      const weight = 70;
      const bodyFat = 15;
      const muscleMass = 30;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: 正しく計算される
      expect(result.fatMass).toBe(10.5); // 70 * 15 / 100 = 10.5
      expect(result.fatMassPercentage).toBe(15.0);
      expect(result.muscleMass).toBe(30.0);
      expect(result.muscleMassPercentage).toBeCloseTo(42.9, 1); // 30 / 70 * 100 ≈ 42.9
      expect(result.otherMass).toBe(29.5); // 70 - 10.5 - 30 = 29.5
      expect(result.otherMassPercentage).toBeCloseTo(42.1, 1); // 29.5 / 70 * 100 ≈ 42.1
    });
  });

  describe("正常系: 境界値の計算", () => {
    it("体脂肪率が0%の場合、正しく計算する", () => {
      // Given: 体脂肪率が0%
      const weight = 100;
      const bodyFat = 0;
      const muscleMass = 50;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: 体脂肪量が0kgで計算される
      expect(result.fatMass).toBe(0.0);
      expect(result.fatMassPercentage).toBe(0.0);
      expect(result.muscleMass).toBe(50.0);
      expect(result.muscleMassPercentage).toBe(50.0);
      expect(result.otherMass).toBe(50.0); // 100 - 0 - 50 = 50
      expect(result.otherMassPercentage).toBe(50.0);
    });

    it("筋肉量が0kgの場合、正しく計算する", () => {
      // Given: 筋肉量が0kg
      const weight = 80;
      const bodyFat = 20;
      const muscleMass = 0;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: 筋肉量が0kgで計算される
      expect(result.fatMass).toBe(16.0); // 80 * 20 / 100 = 16
      expect(result.fatMassPercentage).toBe(20.0);
      expect(result.muscleMass).toBe(0.0);
      expect(result.muscleMassPercentage).toBe(0.0);
      expect(result.otherMass).toBe(64.0); // 80 - 16 - 0 = 64
      expect(result.otherMassPercentage).toBe(80.0);
    });

    it("体脂肪率が100%の場合、正しく計算する", () => {
      // Given: 体脂肪率が100%
      const weight = 100;
      const bodyFat = 100;
      const muscleMass = 0;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: すべてが体脂肪
      expect(result.fatMass).toBe(100.0);
      expect(result.fatMassPercentage).toBe(100.0);
      expect(result.muscleMass).toBe(0.0);
      expect(result.muscleMassPercentage).toBe(0.0);
      expect(result.otherMass).toBe(0.0);
      expect(result.otherMassPercentage).toBe(0.0);
    });

    it("体脂肪量+筋肉量=体重の場合、その他が0kgになる", () => {
      // Given: 体脂肪量+筋肉量が体重と等しい
      const weight = 100;
      const bodyFat = 20; // 20kg
      const muscleMass = 80;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: その他が0kg
      expect(result.fatMass).toBe(20.0);
      expect(result.fatMassPercentage).toBe(20.0);
      expect(result.muscleMass).toBe(80.0);
      expect(result.muscleMassPercentage).toBe(80.0);
      expect(result.otherMass).toBe(0.0);
      expect(result.otherMassPercentage).toBe(0.0);
    });
  });

  describe("正常系: 小数点の丸め処理", () => {
    it("小数点第2位以下を正しく丸める", () => {
      // Given: 小数が発生する計算
      const weight = 70.5;
      const bodyFat = 15.5;
      const muscleMass = 30.5;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: 小数点第1位まで丸められる
      expect(result.fatMass).toBeCloseTo(10.9, 1); // 70.5 * 15.5 / 100 ≈ 10.9275 → 10.9
      expect(result.fatMassPercentage).toBeCloseTo(15.5, 1);
      expect(result.muscleMass).toBe(30.5);
      expect(result.muscleMassPercentage).toBeCloseTo(43.3, 1); // 30.5 / 70.5 * 100 ≈ 43.26
      expect(result.otherMass).toBeCloseTo(29.1, 1); // 70.5 - 10.9275 - 30.5 ≈ 29.0725
      expect(result.otherMassPercentage).toBeCloseTo(41.2, 1); // 29.0725 / 70.5 * 100 ≈ 41.24
    });

    it("丸めによる誤差が小数点第1位に収まる", () => {
      // Given: 丸め誤差が発生しやすい値
      const weight = 66.6;
      const bodyFat = 13.3;
      const muscleMass = 28.8;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: すべて小数点第1位まで丸められる
      expect(result.fatMass).toBeCloseTo(8.9, 1);
      expect(result.muscleMass).toBe(28.8);
      expect(result.otherMass).toBeCloseTo(28.9, 1);
      // 割合の合計が100%に近い（丸め誤差で±0.1%程度の差異は許容）
      const totalPercentage =
        result.fatMassPercentage +
        result.muscleMassPercentage +
        result.otherMassPercentage;
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe("正常系: 割合の計算", () => {
    it("各成分の割合が正しく計算される", () => {
      // Given: 割合の計算が簡単な値
      const weight = 100;
      const bodyFat = 20; // 20kg = 20%
      const muscleMass = 30; // 30kg = 30%

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: 割合が正しい
      expect(result.fatMassPercentage).toBe(20.0);
      expect(result.muscleMassPercentage).toBe(30.0);
      expect(result.otherMassPercentage).toBe(50.0); // 50kg = 50%
    });

    it("割合の合計が100%になる", () => {
      // Given: 任意の体組成データ
      const weight = 75;
      const bodyFat = 18;
      const muscleMass = 32;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: 割合の合計が100%（丸め誤差で±0.2%程度の差異は許容）
      const totalPercentage =
        result.fatMassPercentage +
        result.muscleMassPercentage +
        result.otherMassPercentage;
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe("正常系: 実用的なシナリオ", () => {
    it("痩せ型の人の体組成を正しく計算する", () => {
      // Given: 痩せ型（低体重・低体脂肪率）
      const weight = 55;
      const bodyFat = 10;
      const muscleMass = 25;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: 正しく計算される
      expect(result.fatMass).toBe(5.5);
      expect(result.muscleMass).toBe(25.0);
      expect(result.otherMass).toBe(24.5);
      expect(result.fatMassPercentage).toBe(10.0);
      expect(result.muscleMassPercentage).toBeCloseTo(45.5, 1);
      expect(result.otherMassPercentage).toBeCloseTo(44.5, 1);
    });

    it("肥満気味の人の体組成を正しく計算する", () => {
      // Given: 肥満気味（高体重・高体脂肪率）
      const weight = 95;
      const bodyFat = 30;
      const muscleMass = 35;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: 正しく計算される
      expect(result.fatMass).toBe(28.5); // 95 * 30 / 100 = 28.5
      expect(result.muscleMass).toBe(35.0);
      expect(result.otherMass).toBe(31.5); // 95 - 28.5 - 35 = 31.5
      expect(result.fatMassPercentage).toBe(30.0);
      expect(result.muscleMassPercentage).toBeCloseTo(36.8, 1);
      expect(result.otherMassPercentage).toBeCloseTo(33.2, 1);
    });

    it("アスリートの体組成を正しく計算する", () => {
      // Given: アスリート（高筋肉量・低体脂肪率）
      const weight = 80;
      const bodyFat = 8;
      const muscleMass = 45;

      // When: 体組成を計算
      const result = calculateBodyComposition(weight, bodyFat, muscleMass);

      // Then: 正しく計算される
      expect(result.fatMass).toBe(6.4); // 80 * 8 / 100 = 6.4
      expect(result.muscleMass).toBe(45.0);
      expect(result.otherMass).toBe(28.6); // 80 - 6.4 - 45 = 28.6
      expect(result.fatMassPercentage).toBe(8.0);
      expect(result.muscleMassPercentage).toBeCloseTo(56.3, 1);
      expect(result.otherMassPercentage).toBeCloseTo(35.7, 1); // 28.6 / 80 * 100 = 35.75 → 35.8（丸め）だが浮動小数点誤差で35.7になる
    });
  });
});
