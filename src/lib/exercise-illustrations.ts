import { MUSCLE_SUB_GROUPS } from "@/constants/body-parts";
import { getBodyPartForMuscleSubGroup } from "@/lib/exercise-mappings";
import type { BodyPart, EquipmentType, MuscleSubGroup } from "@/types/workout";

type ExerciseIllustration = {
  src?: string;
  alt: string;
  isFallback: boolean;
  fit: ExerciseIllustrationFit;
  fallbackKind?: "compound" | "subgroup";
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
  プッシュアップ: "/exercise-illustrations/chest/push-up.png",
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
  リバースグリップラットプルダウン:
    "/exercise-illustrations/back/reverse-grip-lat-pulldown.png",
  ワイドグリップチンニング:
    "/exercise-illustrations/back/wide-grip-chinning.png",
  バーベルローイング:
    "/exercise-illustrations/back/barbell-rowing.png",
  シーテッドロー: "/exercise-illustrations/back/seated-row.png",
  ワンハンドローイング: "/exercise-illustrations/back/one-hand-row.png",
  Tバーローイング: "/exercise-illustrations/back/t-bar-rowing.png",
  "T バーローイング": "/exercise-illustrations/back/t-bar-rowing.png",
  ケーブルローイング: "/exercise-illustrations/back/cable-rowing.png",
  ハイパーエクステンション:
    "/exercise-illustrations/back/hyperextension.png",
  シュラッグ: "/exercise-illustrations/back/shrug.png",
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
  スプリットスクワット:
    "/exercise-illustrations/legs/split-squat.png",
  ランジ: "/exercise-illustrations/legs/lunge.png",
  ステップアップ: "/exercise-illustrations/legs/step-up.png",
  ルーマニアンデッドリフト:
    "/exercise-illustrations/legs/romanian-deadlift.png",
  ヒップスラスト: "/exercise-illustrations/legs/hip-thrust.png",
  カーフレイズ: "/exercise-illustrations/legs/calf-raise.png",
  レッグカール: "/exercise-illustrations/legs/leg-curl.png",
  ハックスクワット: "/exercise-illustrations/legs/hack-squat.png",

  ダンベルショルダープレス:
    "/exercise-illustrations/shoulders/dumbbell-shoulder-press.png",
  サイドレイズ: "/exercise-illustrations/shoulders/side-raise.png",
  リアデルトフライ:
    "/exercise-illustrations/shoulders/rear-delt-fly.png",
  ショルダープレス:
    "/exercise-illustrations/shoulders/shoulder-press-machine.png",
  ミリタリープレス:
    "/exercise-illustrations/shoulders/military-press.png",
  アーノルドプレス:
    "/exercise-illustrations/shoulders/arnold-press.png",
  フロントレイズ: "/exercise-illustrations/shoulders/front-raise.png",
  バーベルフロントレイズ:
    "/exercise-illustrations/shoulders/barbell-front-raise.png",
  ケーブルラテラルレイズ:
    "/exercise-illustrations/shoulders/cable-lateral-raise.png",
  アップライトロウ:
    "/exercise-illustrations/shoulders/upright-row.png",
  リバースペックフライ:
    "/exercise-illustrations/shoulders/reverse-pec-fly.png",
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
  プリーチャーカール:
    "/exercise-illustrations/arms/preacher-curl.png",
  コンセントレーションカール:
    "/exercise-illustrations/arms/concentration-curl.png",
  リバースカール: "/exercise-illustrations/arms/reverse-curl.png",
  トライセプスプッシュダウン:
    "/exercise-illustrations/arms/triceps-push-down.png",
  ケーブルキックバック:
    "/exercise-illustrations/arms/cable-kickback.png",
  オーバーヘッドエクステンション:
    "/exercise-illustrations/arms/overhead-extension.png",
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
  クローズグリッププッシュアップ:
    "/exercise-illustrations/arms/close-grip-push-up.png",
  ケーブルハンマーカール:
    "/exercise-illustrations/arms/cable-hammer-curl.png",

  レッグレイズ: "/exercise-illustrations/core/leg-raise.png",
  クランチ: "/exercise-illustrations/core/crunch.png",
  シットアップベンチ:
    "/exercise-illustrations/core/sit-up-bench.png",
  マウンテンクライマー:
    "/exercise-illustrations/core/mountain-climber.png",
  ハンギングレッグレイズ:
    "/exercise-illustrations/core/hanging-leg-raise.png",
  シットアップ: "/exercise-illustrations/core/sit-up.png",
  アブローラー: "/exercise-illustrations/core/ab-roller.png",
  サイドプランク: "/exercise-illustrations/core/side-plank.png",
  ロシアンツイスト:
    "/exercise-illustrations/core/russian-twist.png",
  バイシクルクランチ:
    "/exercise-illustrations/core/bicycle-crunch.png",
  アブドミナルクランチ:
    "/exercise-illustrations/core/abdominal-crunch.png",
  プランク: "/exercise-illustrations/core/plank.png",
  ロータリートーソ: "/exercise-illustrations/core/rotary-torso.png",
  サイドベント: "/exercise-illustrations/core/side-bend.png",
  "サイドベント（バックエクステンションベンチ）":
    "/exercise-illustrations/core/side-bend-back-extension-bench.png",
  バックエクステンションベンチサイドベント:
    "/exercise-illustrations/core/side-bend-back-extension-bench.png",

  ランニング: "/exercise-illustrations/other/running.png",
  エアロバイク: "/exercise-illustrations/other/exercise-bike.png",
  ローイングマシン:
    "/exercise-illustrations/other/rowing-machine.png",
  ステアクライマー:
    "/exercise-illustrations/other/stair-climber.png",
  クロストレーナー:
    "/exercise-illustrations/other/cross-trainer.png",
  スピンバイク: "/exercise-illustrations/other/spin-bike.png",
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

const COMPOUND_FALLBACK_BY_NAME: Record<string, string> = {
  [normalizeExerciseName("ディップス")]:
    "/exercise-illustrations/fallback/upper-front/chest-lower-triceps.png",
  [normalizeExerciseName("ディッププレス")]:
    "/exercise-illustrations/fallback/upper-front/chest-lower-triceps.png",
  [normalizeExerciseName("ディップスマシン")]:
    "/exercise-illustrations/fallback/upper-front/chest-lower-triceps.png",
  [normalizeExerciseName("プッシュアップ")]:
    "/exercise-illustrations/fallback/upper-front/chest-triceps.png",
  [normalizeExerciseName("ナローベンチプレス")]:
    "/exercise-illustrations/fallback/upper-front/chest-triceps.png",
  [normalizeExerciseName("スミスナロープレス")]:
    "/exercise-illustrations/fallback/upper-front/chest-triceps.png",
  [normalizeExerciseName("ナロープレス")]:
    "/exercise-illustrations/fallback/upper-front/chest-triceps.png",
  [normalizeExerciseName("クローズグリッププッシュアップ")]:
    "/exercise-illustrations/fallback/upper-front/chest-triceps.png",
  [normalizeExerciseName("懸垂")]:
    "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [normalizeExerciseName("ラットプルダウン")]:
    "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [normalizeExerciseName("フロントラットプルダウン")]:
    "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [normalizeExerciseName("シーテッドロー")]:
    "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [normalizeExerciseName("ワンハンドローイング")]:
    "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [normalizeExerciseName("Tバーローイング")]:
    "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [normalizeExerciseName("T バーローイング")]:
    "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [normalizeExerciseName("シーテッドケーブルロー")]:
    "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [normalizeExerciseName("デッドリフト")]:
    "/exercise-illustrations/fallback/full-back/posterior-chain.png",
  [normalizeExerciseName("ハーフデッドリフト")]:
    "/exercise-illustrations/fallback/full-back/posterior-chain.png",
  [normalizeExerciseName("ルーマニアンデッドリフト")]:
    "/exercise-illustrations/fallback/full-back/posterior-chain.png",
};

const SUBGROUP_FALLBACK_BY_KEY: Partial<Record<MuscleSubGroup, string>> = {
  [MUSCLE_SUB_GROUPS.CHEST_OVERALL]:
    "/exercise-illustrations/fallback/upper-front/chest-overall.png",
  [MUSCLE_SUB_GROUPS.CHEST_UPPER]:
    "/exercise-illustrations/fallback/upper-front/chest-upper.png",
  [MUSCLE_SUB_GROUPS.CHEST_LOWER]:
    "/exercise-illustrations/fallback/upper-front/chest-lower.png",
  [MUSCLE_SUB_GROUPS.CHEST_OUTER]:
    "/exercise-illustrations/fallback/upper-front/chest-outer.png",
  [MUSCLE_SUB_GROUPS.BACK_OVERALL]:
    "/exercise-illustrations/fallback/upper-back/back-overall.png",
  [MUSCLE_SUB_GROUPS.BACK_WIDTH]:
    "/exercise-illustrations/fallback/upper-back/back-width.png",
  [MUSCLE_SUB_GROUPS.BACK_THICKNESS]:
    "/exercise-illustrations/fallback/upper-back/back-thickness.png",
  [MUSCLE_SUB_GROUPS.BACK_TRAPS]:
    "/exercise-illustrations/fallback/upper-back/back-traps.png",
  [MUSCLE_SUB_GROUPS.BACK_ERECTORS]:
    "/exercise-illustrations/fallback/upper-back/back-erectors.png",
  [MUSCLE_SUB_GROUPS.LEGS_QUADS]:
    "/exercise-illustrations/fallback/lower-front/legs-quads.png",
  [MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS]:
    "/exercise-illustrations/fallback/lower-back/legs-hamstrings.png",
  [MUSCLE_SUB_GROUPS.LEGS_GLUTES]:
    "/exercise-illustrations/fallback/lower-back/legs-glutes.png",
  [MUSCLE_SUB_GROUPS.LEGS_CALVES]:
    "/exercise-illustrations/fallback/lower-back/legs-calves.png",
  [MUSCLE_SUB_GROUPS.LEGS_ADDUCTORS]:
    "/exercise-illustrations/fallback/lower-front/legs-adductors.png",
  [MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL]:
    "/exercise-illustrations/fallback/upper-front/shoulders-middle.png",
  [MUSCLE_SUB_GROUPS.SHOULDERS_FRONT]:
    "/exercise-illustrations/fallback/upper-front/shoulders-front.png",
  [MUSCLE_SUB_GROUPS.SHOULDERS_MIDDLE]:
    "/exercise-illustrations/fallback/upper-front/shoulders-middle.png",
  [MUSCLE_SUB_GROUPS.SHOULDERS_REAR]:
    "/exercise-illustrations/fallback/upper-back/shoulders-rear.png",
  [MUSCLE_SUB_GROUPS.ARMS_BICEPS]:
    "/exercise-illustrations/fallback/upper-front/arms-biceps.png",
  [MUSCLE_SUB_GROUPS.ARMS_TRICEPS]:
    "/exercise-illustrations/fallback/upper-back/arms-triceps.png",
  [MUSCLE_SUB_GROUPS.ARMS_FOREARMS]:
    "/exercise-illustrations/fallback/upper-front/arms-forearms.png",
  [MUSCLE_SUB_GROUPS.CORE_RECTUS]:
    "/exercise-illustrations/fallback/upper-front/core-rectus.png",
  [MUSCLE_SUB_GROUPS.CORE_TRANSVERSE]:
    "/exercise-illustrations/fallback/upper-front/core-transverse.png",
  [MUSCLE_SUB_GROUPS.CORE_OBLIQUES]:
    "/exercise-illustrations/fallback/upper-front/core-obliques.png",
  [MUSCLE_SUB_GROUPS.CORE_HIP_FLEXORS]:
    "/exercise-illustrations/fallback/full-front/core-hip-flexors.png",
};

const DEFAULT_FALLBACK_BY_PART: Partial<Record<Exclude<BodyPart, "all">, string>> = {
  chest: "/exercise-illustrations/fallback/upper-front/chest-overall.png",
  back: "/exercise-illustrations/fallback/upper-back/back-overall.png",
  legs: "/exercise-illustrations/fallback/lower-front/legs-quads.png",
  shoulders: "/exercise-illustrations/fallback/upper-front/shoulders-middle.png",
  arms: "/exercise-illustrations/fallback/upper-front/arms-biceps.png",
  core: "/exercise-illustrations/fallback/upper-front/core-rectus.png",
};

function createTargetGroupKey(targetMuscleGroups: MuscleSubGroup[]): string {
  return [...new Set(targetMuscleGroups)].sort().join("+");
}

const COMPOUND_FALLBACK_BY_TARGET_GROUPS: Record<string, string> = {
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.CHEST_LOWER,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ])]: "/exercise-illustrations/fallback/upper-front/chest-lower-triceps.png",
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.CHEST_OVERALL,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ])]: "/exercise-illustrations/fallback/upper-front/chest-triceps.png",
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.CHEST_UPPER,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ])]: "/exercise-illustrations/fallback/upper-front/chest-triceps.png",
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.CHEST_OUTER,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ])]: "/exercise-illustrations/fallback/upper-front/chest-triceps.png",
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.BACK_WIDTH,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ])]: "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.BACK_THICKNESS,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ])]: "/exercise-illustrations/fallback/upper-back/back-biceps.png",
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.BACK_TRAPS,
    MUSCLE_SUB_GROUPS.SHOULDERS_REAR,
  ])]: "/exercise-illustrations/fallback/upper-back/back-traps-shoulders-rear.png",
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.LEGS_QUADS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
  ])]: "/exercise-illustrations/fallback/lower-front/quads-glutes.png",
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
    MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
  ])]: "/exercise-illustrations/fallback/lower-back/glutes-hamstrings.png",
  [createTargetGroupKey([
    MUSCLE_SUB_GROUPS.BACK_ERECTORS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
    MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
  ])]: "/exercise-illustrations/fallback/full-back/posterior-chain.png",
};

function normalizeSubGroupForBodyPart(
  bodyPart: Exclude<BodyPart, "all">,
  muscleSubGroup?: MuscleSubGroup
): MuscleSubGroup | undefined {
  if (!muscleSubGroup) return undefined;

  if (
    muscleSubGroup === MUSCLE_SUB_GROUPS.CHEST_OVERALL &&
    bodyPart !== "chest"
  ) {
    if (bodyPart === "back") return MUSCLE_SUB_GROUPS.BACK_OVERALL;
    if (bodyPart === "shoulders") return MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL;
    return undefined;
  }

  return muscleSubGroup;
}

export function resolveExerciseIllustration({
  name,
  bodyPart,
  equipmentType,
  muscleSubGroup,
  targetMuscleGroups,
}: {
  name: string;
  bodyPart: Exclude<BodyPart, "all">;
  equipmentType?: EquipmentType;
  muscleSubGroup?: MuscleSubGroup;
  targetMuscleGroups?: MuscleSubGroup[];
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

  const compoundFallbackSrc =
    COMPOUND_FALLBACK_BY_NAME[normalizedName] ??
    COMPOUND_FALLBACK_BY_NAME[nameWithoutDetails];

  if (compoundFallbackSrc) {
    return {
      src: compoundFallbackSrc,
      alt: `${name}の複合部位フォールバック線画`,
      isFallback: true,
      fallbackKind: "compound",
      fit: DEFAULT_FIT,
    };
  }

  const normalizedSubGroup = normalizeSubGroupForBodyPart(bodyPart, muscleSubGroup);
  const resolvedTargetMuscleGroups =
    targetMuscleGroups?.length
      ? targetMuscleGroups
      : normalizedSubGroup
        ? [normalizedSubGroup]
        : [];

  const compoundTargetFallbackSrc =
    COMPOUND_FALLBACK_BY_TARGET_GROUPS[
      createTargetGroupKey(resolvedTargetMuscleGroups)
    ];

  if (compoundTargetFallbackSrc) {
    return {
      src: compoundTargetFallbackSrc,
      alt: `${name}の複合対象筋フォールバック線画`,
      isFallback: true,
      fallbackKind: "compound",
      fit: DEFAULT_FIT,
    };
  }

  const primaryTargetMuscleGroup =
    resolvedTargetMuscleGroups.find(
      (targetMuscleGroup) =>
        getBodyPartForMuscleSubGroup(targetMuscleGroup) === bodyPart
    ) ?? resolvedTargetMuscleGroups[0];
  const subgroupFallbackSrc =
    primaryTargetMuscleGroup && SUBGROUP_FALLBACK_BY_KEY[primaryTargetMuscleGroup];

  if (subgroupFallbackSrc) {
    return {
      src: subgroupFallbackSrc,
      alt: `${name}の部位フォールバック線画`,
      isFallback: true,
      fallbackKind: "subgroup",
      fit: DEFAULT_FIT,
    };
  }

  const defaultFallbackSrc = DEFAULT_FALLBACK_BY_PART[bodyPart];

  if (defaultFallbackSrc) {
    return {
      src: defaultFallbackSrc,
      alt: `${name}の人体フォールバック線画`,
      isFallback: true,
      fallbackKind: "subgroup",
      fit: DEFAULT_FIT,
    };
  }

  return {
    alt: `${name}の${equipmentType ?? bodyPart}アイコン`,
    isFallback: true,
    src: undefined,
    fit: DEFAULT_FIT,
  };
}
