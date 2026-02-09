/**
 * Big3関連ロジックのテスト
 */

import { describe, it, expect } from "vitest";
import {
  createBig3Data,
  DEFAULT_BIG3_TARGETS,
  type Big3Weights,
  type Big3Targets,
} from "@/lib/big3";

describe("createBig3Data", () => {
  describe("正常系: 標準的なBig3データの作成", () => {
    it("標準的な値でBig3データを正しく作成する", () => {
      // Given: 標準的な重量と目標
      const weights: Big3Weights = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };
      const targets: Big3Targets = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: 正しいデータ構造が返る
      expect(result).toEqual({
        benchPress: {
          name: "ベンチプレス",
          current: 60,
          target: 60,
          color: "bg-red-500",
        },
        squat: {
          name: "スクワット",
          current: 80,
          target: 80,
          color: "bg-green-500",
        },
        deadlift: {
          name: "デッドリフト",
          current: 100,
          target: 100,
          color: "bg-blue-500",
        },
      });
    });

    it("デフォルトの目標値を使用してBig3データを作成する", () => {
      // Given: 標準的な重量とデフォルトの目標
      const weights: Big3Weights = {
        benchPress: 50,
        squat: 70,
        deadlift: 90,
      };

      // When: デフォルトの目標でBig3データを作成
      const result = createBig3Data(weights, DEFAULT_BIG3_TARGETS);

      // Then: デフォルトの目標値が使用される
      expect(result.benchPress.target).toBe(60);
      expect(result.squat.target).toBe(80);
      expect(result.deadlift.target).toBe(100);
    });
  });

  describe("正常系: 目標達成の判定", () => {
    it("現在の重量が目標と等しい場合、目標達成", () => {
      // Given: 現在の重量 = 目標
      const weights: Big3Weights = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };
      const targets: Big3Targets = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: current = target
      expect(result.benchPress.current).toBe(result.benchPress.target);
      expect(result.squat.current).toBe(result.squat.target);
      expect(result.deadlift.current).toBe(result.deadlift.target);
    });

    it("現在の重量が目標より小さい場合、目標未達成", () => {
      // Given: 現在の重量 < 目標
      const weights: Big3Weights = {
        benchPress: 50,
        squat: 70,
        deadlift: 90,
      };
      const targets: Big3Targets = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: current < target
      expect(result.benchPress.current).toBeLessThan(result.benchPress.target);
      expect(result.squat.current).toBeLessThan(result.squat.target);
      expect(result.deadlift.current).toBeLessThan(result.deadlift.target);
    });

    it("現在の重量が目標より大きい場合、目標超過", () => {
      // Given: 現在の重量 > 目標
      const weights: Big3Weights = {
        benchPress: 70,
        squat: 90,
        deadlift: 110,
      };
      const targets: Big3Targets = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: current > target
      expect(result.benchPress.current).toBeGreaterThan(
        result.benchPress.target
      );
      expect(result.squat.current).toBeGreaterThan(result.squat.target);
      expect(result.deadlift.current).toBeGreaterThan(result.deadlift.target);
    });
  });

  describe("正常系: 境界値", () => {
    it("重量が0の場合、正しくデータを作成する", () => {
      // Given: 重量が0
      const weights: Big3Weights = {
        benchPress: 0,
        squat: 0,
        deadlift: 0,
      };
      const targets: Big3Targets = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: current = 0
      expect(result.benchPress.current).toBe(0);
      expect(result.squat.current).toBe(0);
      expect(result.deadlift.current).toBe(0);
    });

    it("目標が0の場合、正しくデータを作成する", () => {
      // Given: 目標が0
      const weights: Big3Weights = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };
      const targets: Big3Targets = {
        benchPress: 0,
        squat: 0,
        deadlift: 0,
      };

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: target = 0
      expect(result.benchPress.target).toBe(0);
      expect(result.squat.target).toBe(0);
      expect(result.deadlift.target).toBe(0);
    });

    it("大きな重量でも正しくデータを作成する", () => {
      // Given: 大きな重量
      const weights: Big3Weights = {
        benchPress: 500,
        squat: 700,
        deadlift: 900,
      };
      const targets: Big3Targets = {
        benchPress: 600,
        squat: 800,
        deadlift: 1000,
      };

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: 正しくデータが作成される
      expect(result.benchPress.current).toBe(500);
      expect(result.benchPress.target).toBe(600);
      expect(result.squat.current).toBe(700);
      expect(result.squat.target).toBe(800);
      expect(result.deadlift.current).toBe(900);
      expect(result.deadlift.target).toBe(1000);
    });

    it("小数点の重量でも正しくデータを作成する", () => {
      // Given: 小数点の重量
      const weights: Big3Weights = {
        benchPress: 60.5,
        squat: 80.5,
        deadlift: 100.5,
      };
      const targets: Big3Targets = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: 小数点が保持される
      expect(result.benchPress.current).toBe(60.5);
      expect(result.squat.current).toBe(80.5);
      expect(result.deadlift.current).toBe(100.5);
    });
  });

  describe("正常系: メタデータの確認", () => {
    it("ベンチプレスのメタデータが正しい", () => {
      // Given: 任意の値
      const weights: Big3Weights = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };
      const targets: Big3Targets = DEFAULT_BIG3_TARGETS;

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: ベンチプレスのメタデータが正しい
      expect(result.benchPress.name).toBe("ベンチプレス");
      expect(result.benchPress.color).toBe("bg-red-500");
    });

    it("スクワットのメタデータが正しい", () => {
      // Given: 任意の値
      const weights: Big3Weights = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };
      const targets: Big3Targets = DEFAULT_BIG3_TARGETS;

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: スクワットのメタデータが正しい
      expect(result.squat.name).toBe("スクワット");
      expect(result.squat.color).toBe("bg-green-500");
    });

    it("デッドリフトのメタデータが正しい", () => {
      // Given: 任意の値
      const weights: Big3Weights = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };
      const targets: Big3Targets = DEFAULT_BIG3_TARGETS;

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: デッドリフトのメタデータが正しい
      expect(result.deadlift.name).toBe("デッドリフト");
      expect(result.deadlift.color).toBe("bg-blue-500");
    });

    it("全てのBig3のキーが存在する", () => {
      // Given: 任意の値
      const weights: Big3Weights = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };
      const targets: Big3Targets = DEFAULT_BIG3_TARGETS;

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: 全てのキーが存在する
      expect(result).toHaveProperty("benchPress");
      expect(result).toHaveProperty("squat");
      expect(result).toHaveProperty("deadlift");
    });

    it("各Big3データに必要なプロパティが全て存在する", () => {
      // Given: 任意の値
      const weights: Big3Weights = {
        benchPress: 60,
        squat: 80,
        deadlift: 100,
      };
      const targets: Big3Targets = DEFAULT_BIG3_TARGETS;

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: 各データに必要なプロパティが存在する
      for (const key of ["benchPress", "squat", "deadlift"] as const) {
        expect(result[key]).toHaveProperty("name");
        expect(result[key]).toHaveProperty("current");
        expect(result[key]).toHaveProperty("target");
        expect(result[key]).toHaveProperty("color");
      }
    });
  });

  describe("正常系: 実用的なシナリオ", () => {
    it("初心者のBig3データを作成する", () => {
      // Given: 初心者の重量
      const weights: Big3Weights = {
        benchPress: 40,
        squat: 50,
        deadlift: 60,
      };
      const targets: Big3Targets = DEFAULT_BIG3_TARGETS;

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: 目標未達成
      expect(result.benchPress.current).toBeLessThan(result.benchPress.target);
      expect(result.squat.current).toBeLessThan(result.squat.target);
      expect(result.deadlift.current).toBeLessThan(result.deadlift.target);
    });

    it("上級者のBig3データを作成する", () => {
      // Given: 上級者の重量
      const weights: Big3Weights = {
        benchPress: 120,
        squat: 160,
        deadlift: 200,
      };
      const targets: Big3Targets = {
        benchPress: 100,
        squat: 140,
        deadlift: 180,
      };

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: 目標超過
      expect(result.benchPress.current).toBeGreaterThan(
        result.benchPress.target
      );
      expect(result.squat.current).toBeGreaterThan(result.squat.target);
      expect(result.deadlift.current).toBeGreaterThan(result.deadlift.target);
    });

    it("一部だけ目標達成しているBig3データを作成する", () => {
      // Given: 一部だけ目標達成
      const weights: Big3Weights = {
        benchPress: 65, // 目標超過
        squat: 80, // 目標達成
        deadlift: 90, // 目標未達成
      };
      const targets: Big3Targets = DEFAULT_BIG3_TARGETS;

      // When: Big3データを作成
      const result = createBig3Data(weights, targets);

      // Then: それぞれ正しい状態
      expect(result.benchPress.current).toBeGreaterThan(
        result.benchPress.target
      );
      expect(result.squat.current).toBe(result.squat.target);
      expect(result.deadlift.current).toBeLessThan(result.deadlift.target);
    });
  });
});

describe("DEFAULT_BIG3_TARGETS", () => {
  it("デフォルトの目標値が正しく定義されている", () => {
    // Then: デフォルト値が正しい
    expect(DEFAULT_BIG3_TARGETS).toEqual({
      benchPress: 60,
      squat: 80,
      deadlift: 100,
    });
  });
});
