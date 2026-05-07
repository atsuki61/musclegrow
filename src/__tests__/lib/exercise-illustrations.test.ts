import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveExerciseIllustration } from "@/lib/exercise-illustrations";

describe("resolveExerciseIllustration", () => {
  it("トレーニング.mdに載っている種目は線画を解決できる", () => {
    const trainingMd = fs.readFileSync(
      path.join(process.cwd(), "docs/トレーニング.md"),
      "utf8"
    );
    const exerciseNames = [...trainingMd.matchAll(/^- (.+)$/gm)].map(
      ([, line]) => line
    );

    expect(exerciseNames.length).toBeGreaterThan(0);

    for (const name of exerciseNames) {
      const illustration = resolveExerciseIllustration({
        name,
        bodyPart: "chest",
      });

      expect(illustration.isFallback, name).toBe(false);
      expect(illustration.src, name).toMatch(/^\/exercise-illustrations\//);
    }
  });

  it("カスタム登録で起きやすい表記ゆれでも同じ線画を解決できる", () => {
    const cases = [
      ["ﾍﾞﾝﾁﾌﾟﾚｽ", "/exercise-illustrations/chest/bench-press.png"],
      ["ベンチ プレス（全体）", "/exercise-illustrations/chest/bench-press.png"],
      ["Ｔ バーローイング（厚み）", "/exercise-illustrations/back/t-bar-rowing.png"],
      [
        "ショルダー プレス・スミス（前部）",
        "/exercise-illustrations/shoulders/smith-shoulder-press.png",
      ],
      [
        "ケーブル プレス ダウン",
        "/exercise-illustrations/arms/cable-press-down.png",
      ],
    ];

    for (const [name, src] of cases) {
      expect(
        resolveExerciseIllustration({ name, bodyPart: "chest" }).src
      ).toBe(src);
    }
  });

  it("小さく見える胸種目は表示補正を返す", () => {
    const benchPress = resolveExerciseIllustration({
      name: "ベンチプレス",
      bodyPart: "chest",
    });
    const pecFly = resolveExerciseIllustration({
      name: "ペックフライ",
      bodyPart: "chest",
    });

    expect(benchPress.fit.scale).toBeGreaterThan(1);
    expect(pecFly.fit.scale).toBeGreaterThan(1);
  });
});
