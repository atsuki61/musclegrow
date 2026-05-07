import type { BodyPart, EquipmentType } from "@/types/workout";

type ExerciseIllustration = {
  src?: string;
  alt: string;
  isFallback: boolean;
  fit: ExerciseIllustrationFit;
};

type ExerciseIllustrationFit = {
  scale: number;
  x: number;
  y: number;
};

const DEFAULT_FIT: ExerciseIllustrationFit = {
  scale: 1,
  x: 0,
  y: 0,
};

const ILLUSTRATION_BY_NAME: Record<string, string> = {
  ベンチプレス: "/exercise-illustrations/chest/bench-press.png",
  インクラインベンチプレス:
    "/exercise-illustrations/chest/incline-smith-press.png",
  チェストプレス: "/exercise-illustrations/chest/chest-press.png",
  ダンベルプレス:
    "/exercise-illustrations/chest/incline-dumbbell-press.png",
  インクラインダンベルプレス:
    "/exercise-illustrations/chest/incline-dumbbell-press.png",
  デクラインプレス: "/exercise-illustrations/chest/decline-press.png",
  デクラインベンチプレス:
    "/exercise-illustrations/chest/decline-press.png",
  ディップス: "/exercise-illustrations/chest/dips.png",
  ディッププレス: "/exercise-illustrations/chest/dip-press-machine.png",
  ディップスマシン: "/exercise-illustrations/chest/dip-press-machine.png",
  ダンベルフライ: "/exercise-illustrations/chest/dumbbell-fly.png",
  ペックフライ: "/exercise-illustrations/chest/pec-fly.png",
  スミスデクラインプレス:
    "/exercise-illustrations/chest/smith-decline-press.png",
  インクラインスミスプレス:
    "/exercise-illustrations/chest/incline-smith-press.png",
  ケーブルフライ: "/exercise-illustrations/chest/cable-crossover.png",
  ケーブルクロスオーバー:
    "/exercise-illustrations/chest/cable-crossover.png",

  デッドリフト: "/exercise-illustrations/back/deadlift.png",
  懸垂: "/exercise-illustrations/back/pull-up.png",
  ラットプルダウン: "/exercise-illustrations/back/lat-pulldown.png",
  シーテッドロー: "/exercise-illustrations/back/seated-row.png",
  ワンハンドローイング: "/exercise-illustrations/back/one-hand-row.png",
  Tバーローイング: "/exercise-illustrations/back/t-bar-rowing.png",
  "T バーローイング": "/exercise-illustrations/back/t-bar-rowing.png",
  フロントラットプルダウン:
    "/exercise-illustrations/back/front-lat-pulldown.png",
  ハーフデッドリフト:
    "/exercise-illustrations/back/half-deadlift.png",
  シーテッドケーブルロー:
    "/exercise-illustrations/back/seated-cable-row.png",

  スクワット: "/exercise-illustrations/legs/squat.png",
  レッグプレス: "/exercise-illustrations/legs/leg-press.png",
  レッグエクステンション:
    "/exercise-illustrations/legs/leg-extension.png",
  ブルガリアンスクワット:
    "/exercise-illustrations/legs/bulgarian-squat.png",
  レッグカール: "/exercise-illustrations/legs/leg-curl.png",
  ハックスクワット: "/exercise-illustrations/legs/hack-squat.png",

  ダンベルショルダープレス:
    "/exercise-illustrations/shoulders/dumbbell-shoulder-press.png",
  サイドレイズ: "/exercise-illustrations/shoulders/side-raise.png",
  リアデルトフライ:
    "/exercise-illustrations/shoulders/rear-delt-fly.png",
  ショルダープレス:
    "/exercise-illustrations/shoulders/shoulder-press-machine.png",
  ケーブルリアデルトフライ:
    "/exercise-illustrations/shoulders/cable-rear-delt-fly.png",
  フェイスプル: "/exercise-illustrations/shoulders/face-pull.png",
  "ショルダープレス・スミス":
    "/exercise-illustrations/shoulders/smith-shoulder-press.png",
  スミスショルダープレス:
    "/exercise-illustrations/shoulders/smith-shoulder-press.png",
  チェストサイドレイズ:
    "/exercise-illustrations/shoulders/chest-side-raise.png",
  ワンハンドダンベルリアレイズ:
    "/exercise-illustrations/shoulders/one-hand-dumbbell-rear-raise.png",
  ケーブルサイドレイズ:
    "/exercise-illustrations/shoulders/cable-side-raise.png",

  バーベルカール: "/exercise-illustrations/arms/barbell-curl.png",
  インクラインダンベルカール:
    "/exercise-illustrations/arms/incline-dumbbell-curl.png",
  ダンベルハンマーカール:
    "/exercise-illustrations/arms/dumbbell-hammer-curl.png",
  ケーブルカール: "/exercise-illustrations/arms/cable-curl.png",
  トライセプスプッシュダウン:
    "/exercise-illustrations/arms/triceps-push-down.png",
  スカルクラッシャー:
    "/exercise-illustrations/arms/skull-crusher.png",
  ナローベンチプレス:
    "/exercise-illustrations/arms/narrow-bench-press.png",
  アームカール: "/exercise-illustrations/arms/arm-curl.png",
  スミスナロープレス:
    "/exercise-illustrations/arms/smith-narrow-press.png",
  ケーブルプレスダウン:
    "/exercise-illustrations/arms/cable-press-down.png",
  ケーブルアームカール:
    "/exercise-illustrations/arms/cable-arm-curl.png",
  ナロープレス: "/exercise-illustrations/arms/narrow-press.png",
  ケーブルハンマーカール:
    "/exercise-illustrations/arms/cable-hammer-curl.png",

  レッグレイズ: "/exercise-illustrations/core/leg-raise.png",
  アブドミナルクランチ:
    "/exercise-illustrations/core/abdominal-crunch.png",
  プランク: "/exercise-illustrations/core/plank.png",
  ロータリートーソ: "/exercise-illustrations/core/rotary-torso.png",
  サイドベント: "/exercise-illustrations/core/side-bend.png",
  "サイドベント（バックエクステンションベンチ）":
    "/exercise-illustrations/core/side-bend-back-extension-bench.png",
  バックエクステンションベンチサイドベント:
    "/exercise-illustrations/core/side-bend-back-extension-bench.png",
};

function normalizeExerciseName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[‐‑‒–—―ー－]/g, "ー")
    .trim();
}

function removeExerciseNameDetails(name: string): string {
  return name.replace(/[（(][^（）()]*[）)]/g, "");
}

const NORMALIZED_ILLUSTRATION_BY_NAME = Object.fromEntries(
  Object.entries(ILLUSTRATION_BY_NAME).map(([name, src]) => [
    normalizeExerciseName(name),
    src,
  ])
);

const ILLUSTRATION_FIT_BY_NAME: Record<string, ExerciseIllustrationFit> = {
  [normalizeExerciseName("ベンチプレス")]: { scale: 1.16, x: 0, y: 2 },
  [normalizeExerciseName("ダンベルプレス")]: { scale: 1.2, x: 0, y: 2 },
  [normalizeExerciseName("インクラインダンベルプレス")]: {
    scale: 1.2,
    x: 0,
    y: 2,
  },
  [normalizeExerciseName("ディップス")]: { scale: 1.14, x: 0, y: 2 },
  [normalizeExerciseName("ダンベルフライ")]: { scale: 1.18, x: 0, y: 2 },
  [normalizeExerciseName("ペックフライ")]: { scale: 1.18, x: 0, y: 2 },
};

export function resolveExerciseIllustration({
  name,
  bodyPart,
  equipmentType,
}: {
  name: string;
  bodyPart: Exclude<BodyPart, "all">;
  equipmentType?: EquipmentType;
}): ExerciseIllustration {
  const normalizedName = normalizeExerciseName(name);
  const nameWithoutDetails = normalizeExerciseName(
    removeExerciseNameDetails(name)
  );
  const src =
    ILLUSTRATION_BY_NAME[name] ??
    NORMALIZED_ILLUSTRATION_BY_NAME[normalizedName] ??
    NORMALIZED_ILLUSTRATION_BY_NAME[nameWithoutDetails];

  if (src) {
    return {
      src,
      alt: `${name}の線画イラスト`,
      isFallback: false,
      fit:
        ILLUSTRATION_FIT_BY_NAME[normalizedName] ??
        ILLUSTRATION_FIT_BY_NAME[nameWithoutDetails] ??
        DEFAULT_FIT,
    };
  }

  return {
    alt: `${name}の${equipmentType ?? bodyPart}アイコン`,
    isFallback: true,
    src: undefined,
    fit: DEFAULT_FIT,
  };
}
