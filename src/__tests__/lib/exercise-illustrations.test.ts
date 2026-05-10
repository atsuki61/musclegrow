import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MUSCLE_SUB_GROUPS } from "@/constants/body-parts";
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

  it("個別線画がある場合は複合フォールバックより個別線画を優先する", () => {
    const illustration = resolveExerciseIllustration({
      name: "ディップス",
      bodyPart: "chest",
      muscleSubGroup: MUSCLE_SUB_GROUPS.CHEST_LOWER,
    });

    expect(illustration).toMatchObject({
      src: "/exercise-illustrations/chest/dips.png",
      isFallback: false,
    });
  });

  it("個別線画がない複合種目名は複合フォールバックを返す", () => {
    const illustration = resolveExerciseIllustration({
      name: "クローズグリッププッシュアップ",
      bodyPart: "arms",
      muscleSubGroup: MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
    });

    expect(illustration).toMatchObject({
      src: "/exercise-illustrations/fallback/upper-front/chest-triceps.png",
      isFallback: true,
      fallbackKind: "compound",
    });
  });

  it("カスタム種目はbodyPartとmuscleSubGroupから単独対象筋フォールバックを返す", () => {
    const illustration = resolveExerciseIllustration({
      name: "カスタム背中種目",
      bodyPart: "back",
      muscleSubGroup: MUSCLE_SUB_GROUPS.BACK_WIDTH,
    });

    expect(illustration).toMatchObject({
      src: "/exercise-illustrations/fallback/upper-back/back-width.png",
      isFallback: true,
      fallbackKind: "subgroup",
    });
  });

  it("胸上部・胸下部・胸全体はそれぞれ専用フォールバックを返す", () => {
    expect(
      resolveExerciseIllustration({
        name: "カスタム胸上部",
        bodyPart: "chest",
        muscleSubGroup: MUSCLE_SUB_GROUPS.CHEST_UPPER,
      }).src
    ).toBe("/exercise-illustrations/fallback/upper-front/chest-upper.png");
    expect(
      resolveExerciseIllustration({
        name: "カスタム胸下部",
        bodyPart: "chest",
        muscleSubGroup: MUSCLE_SUB_GROUPS.CHEST_LOWER,
      }).src
    ).toBe("/exercise-illustrations/fallback/upper-front/chest-lower.png");
    expect(
      resolveExerciseIllustration({
        name: "カスタム胸全体",
        bodyPart: "chest",
        muscleSubGroup: MUSCLE_SUB_GROUPS.CHEST_OVERALL,
      }).src
    ).toBe("/exercise-illustrations/fallback/upper-front/chest-overall.png");
  });

  it("targetMuscleGroupsの複合対象筋は複合フォールバックを返す", () => {
    const illustration = resolveExerciseIllustration({
      name: "未登録ディップ系",
      bodyPart: "chest",
      targetMuscleGroups: [
        MUSCLE_SUB_GROUPS.CHEST_LOWER,
        MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
      ],
    });

    expect(illustration).toMatchObject({
      src: "/exercise-illustrations/fallback/upper-front/chest-lower-triceps.png",
      isFallback: true,
      fallbackKind: "compound",
    });
  });

  it("bodyPartと矛盾する古いchest_overallはbodyPart側の全体フォールバックへ丸める", () => {
    const illustration = resolveExerciseIllustration({
      name: "未登録の背中種目",
      bodyPart: "back",
      muscleSubGroup: MUSCLE_SUB_GROUPS.CHEST_OVERALL,
    });

    expect(illustration).toMatchObject({
      src: "/exercise-illustrations/fallback/upper-back/back-overall.png",
      isFallback: true,
      fallbackKind: "subgroup",
    });
  });

  it("人体フォールバック対象外の部位は既存アイコンフォールバックまで落ちる", () => {
    const illustration = resolveExerciseIllustration({
      name: "未登録種目",
      bodyPart: "other",
    });

    expect(illustration).toMatchObject({
      src: undefined,
      isFallback: true,
    });
  });

  it("返したフォールバック画像はpublic配下に存在する", () => {
    const illustrations = [
      resolveExerciseIllustration({
        name: "クローズグリッププッシュアップ",
        bodyPart: "arms",
        muscleSubGroup: MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
      }),
      resolveExerciseIllustration({
        name: "カスタム背中種目",
        bodyPart: "back",
        muscleSubGroup: MUSCLE_SUB_GROUPS.BACK_WIDTH,
      }),
      resolveExerciseIllustration({
        name: "未登録の脚種目",
        bodyPart: "legs",
      }),
    ];

    for (const illustration of illustrations) {
      expect(illustration.src).toBeDefined();
      expect(
        fs.existsSync(path.join(process.cwd(), "public", illustration.src!))
      ).toBe(true);
    }
  });
});
