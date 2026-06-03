import { nanoid } from "nanoid";
import { db } from "./index";
import { exercises } from "./schemas/app";
import { MUSCLE_SUB_GROUPS } from "../src/constants/body-parts";
import {
  NAME_EN_MAP,
  getEquipmentType,
  resolveSubGroupForBodyPart,
} from "../src/lib/exercise-mappings";
import type { MuscleSubGroup } from "../src/types/workout";

const createExerciseTargetKey = (bodyPart: string, name: string) =>
  `${bodyPart}:${name}`;

const TARGET_MUSCLE_GROUPS_BY_EXERCISE: Record<string, MuscleSubGroup[]> = {
  // 胸
  [createExerciseTargetKey("chest", "ベンチプレス")]: [
    MUSCLE_SUB_GROUPS.CHEST_OVERALL,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("chest", "ダンベルプレス")]: [
    MUSCLE_SUB_GROUPS.CHEST_OVERALL,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("chest", "チェストプレス")]: [
    MUSCLE_SUB_GROUPS.CHEST_OVERALL,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("chest", "インクラインダンベルプレス")]: [
    MUSCLE_SUB_GROUPS.CHEST_UPPER,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("chest", "インクラインベンチプレス")]: [
    MUSCLE_SUB_GROUPS.CHEST_UPPER,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("chest", "デクラインプレス")]: [
    MUSCLE_SUB_GROUPS.CHEST_LOWER,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("chest", "デクラインベンチプレス")]: [
    MUSCLE_SUB_GROUPS.CHEST_LOWER,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("chest", "ディップス")]: [
    MUSCLE_SUB_GROUPS.CHEST_LOWER,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("chest", "プッシュアップ")]: [
    MUSCLE_SUB_GROUPS.CHEST_OUTER,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],

  // 背中
  [createExerciseTargetKey("back", "デッドリフト")]: [
    MUSCLE_SUB_GROUPS.BACK_ERECTORS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
    MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
  ],
  [createExerciseTargetKey("back", "懸垂")]: [
    MUSCLE_SUB_GROUPS.BACK_WIDTH,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ],
  [createExerciseTargetKey("back", "ラットプルダウン")]: [
    MUSCLE_SUB_GROUPS.BACK_WIDTH,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ],
  [createExerciseTargetKey("back", "リバースグリップラットプルダウン")]: [
    MUSCLE_SUB_GROUPS.BACK_WIDTH,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ],
  [createExerciseTargetKey("back", "ワイドグリップチンニング")]: [
    MUSCLE_SUB_GROUPS.BACK_WIDTH,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ],
  [createExerciseTargetKey("back", "バーベルローイング")]: [
    MUSCLE_SUB_GROUPS.BACK_THICKNESS,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ],
  [createExerciseTargetKey("back", "シーテッドロー")]: [
    MUSCLE_SUB_GROUPS.BACK_THICKNESS,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ],
  [createExerciseTargetKey("back", "ワンハンドローイング")]: [
    MUSCLE_SUB_GROUPS.BACK_THICKNESS,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ],
  [createExerciseTargetKey("back", "T バーローイング")]: [
    MUSCLE_SUB_GROUPS.BACK_THICKNESS,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ],
  [createExerciseTargetKey("back", "ケーブルローイング")]: [
    MUSCLE_SUB_GROUPS.BACK_THICKNESS,
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  ],
  [createExerciseTargetKey("back", "ハイパーエクステンション")]: [
    MUSCLE_SUB_GROUPS.BACK_ERECTORS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
    MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
  ],
  [createExerciseTargetKey("back", "シュラッグ")]: [
    MUSCLE_SUB_GROUPS.BACK_TRAPS,
  ],
  [createExerciseTargetKey("back", "フェイスプル")]: [
    MUSCLE_SUB_GROUPS.BACK_TRAPS,
    MUSCLE_SUB_GROUPS.SHOULDERS_REAR,
  ],

  // 脚
  [createExerciseTargetKey("legs", "スクワット")]: [
    MUSCLE_SUB_GROUPS.LEGS_QUADS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
  ],
  [createExerciseTargetKey("legs", "レッグプレス")]: [
    MUSCLE_SUB_GROUPS.LEGS_QUADS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
  ],
  [createExerciseTargetKey("legs", "ブルガリアンスクワット")]: [
    MUSCLE_SUB_GROUPS.LEGS_QUADS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
  ],
  [createExerciseTargetKey("legs", "スプリットスクワット")]: [
    MUSCLE_SUB_GROUPS.LEGS_QUADS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
  ],
  [createExerciseTargetKey("legs", "ランジ")]: [
    MUSCLE_SUB_GROUPS.LEGS_QUADS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
  ],
  [createExerciseTargetKey("legs", "ステップアップ")]: [
    MUSCLE_SUB_GROUPS.LEGS_QUADS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
  ],
  [createExerciseTargetKey("legs", "ルーマニアンデッドリフト")]: [
    MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
    MUSCLE_SUB_GROUPS.BACK_ERECTORS,
  ],
  [createExerciseTargetKey("legs", "ヒップスラスト")]: [
    MUSCLE_SUB_GROUPS.LEGS_GLUTES,
    MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
  ],

  // 肩
  [createExerciseTargetKey("shoulders", "ダンベルショルダープレス")]: [
    MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("shoulders", "ショルダープレス")]: [
    MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("shoulders", "ミリタリープレス")]: [
    MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("shoulders", "アーノルドプレス")]: [
    MUSCLE_SUB_GROUPS.SHOULDERS_OVERALL,
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  ],
  [createExerciseTargetKey("shoulders", "フェイスプル")]: [
    MUSCLE_SUB_GROUPS.SHOULDERS_REAR,
    MUSCLE_SUB_GROUPS.BACK_TRAPS,
  ],

  // 腕
  [createExerciseTargetKey("arms", "ダンベルハンマーカール")]: [
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
    MUSCLE_SUB_GROUPS.ARMS_FOREARMS,
  ],
  [createExerciseTargetKey("arms", "リバースカール")]: [
    MUSCLE_SUB_GROUPS.ARMS_BICEPS,
    MUSCLE_SUB_GROUPS.ARMS_FOREARMS,
  ],
  [createExerciseTargetKey("arms", "ナローベンチプレス")]: [
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
    MUSCLE_SUB_GROUPS.CHEST_OVERALL,
  ],
  [createExerciseTargetKey("arms", "クローズグリッププッシュアップ")]: [
    MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
    MUSCLE_SUB_GROUPS.CHEST_OVERALL,
  ],

  // 腹筋
  [createExerciseTargetKey("core", "レッグレイズ")]: [
    MUSCLE_SUB_GROUPS.CORE_RECTUS,
    MUSCLE_SUB_GROUPS.CORE_HIP_FLEXORS,
  ],
  [createExerciseTargetKey("core", "ハンギングレッグレイズ")]: [
    MUSCLE_SUB_GROUPS.CORE_RECTUS,
    MUSCLE_SUB_GROUPS.CORE_HIP_FLEXORS,
  ],
  [createExerciseTargetKey("core", "マウンテンクライマー")]: [
    MUSCLE_SUB_GROUPS.CORE_RECTUS,
    MUSCLE_SUB_GROUPS.CORE_HIP_FLEXORS,
  ],
  [createExerciseTargetKey("core", "プランク")]: [
    MUSCLE_SUB_GROUPS.CORE_TRANSVERSE,
    MUSCLE_SUB_GROUPS.CORE_RECTUS,
  ],
  [createExerciseTargetKey("core", "アブローラー")]: [
    MUSCLE_SUB_GROUPS.CORE_TRANSVERSE,
    MUSCLE_SUB_GROUPS.CORE_RECTUS,
  ],
};

function getTargetMuscleGroupsForSeedExercise(
  exercise: { bodyPart: string; name: string },
  primarySubGroup: MuscleSubGroup | null
): MuscleSubGroup[] | null {
  if (exercise.bodyPart === "other") return [];

  const targetMuscleGroups =
    TARGET_MUSCLE_GROUPS_BY_EXERCISE[
      createExerciseTargetKey(exercise.bodyPart, exercise.name)
    ];

  if (targetMuscleGroups) return targetMuscleGroups;
  if (primarySubGroup) return [primarySubGroup];
  return null;
}

// 種目データの定義（種目.mdから抽出）
const seedExercises = [
  // ===== 胸 =====
  // 全体
  {
    name: "ベンチプレス",
    bodyPart: "chest",
    subGroup: "全体",
    tier: "initial",
    isBig3: true,
  },
  {
    name: "ダンベルプレス",
    bodyPart: "chest",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "チェストプレス",
    bodyPart: "chest",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  // 上部
  {
    name: "インクラインダンベルプレス",
    bodyPart: "chest",
    subGroup: "上部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "インクラインベンチプレス",
    bodyPart: "chest",
    subGroup: "上部",
    tier: "selectable",
    isBig3: false,
  },
  // 下部
  {
    name: "デクラインプレス",
    bodyPart: "chest",
    subGroup: "下部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "デクラインベンチプレス",
    bodyPart: "chest",
    subGroup: "下部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ディップス",
    bodyPart: "chest",
    subGroup: "下部",
    tier: "initial",
    isBig3: false,
  },
  // 外側
  {
    name: "ダンベルフライ",
    bodyPart: "chest",
    subGroup: "外側",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ペックフライ",
    bodyPart: "chest",
    subGroup: "外側",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ケーブルフライ",
    bodyPart: "chest",
    subGroup: "外側",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルクロスオーバー",
    bodyPart: "chest",
    subGroup: "外側",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "プッシュアップ",
    bodyPart: "chest",
    subGroup: "外側",
    tier: "selectable",
    isBig3: false,
  },

  // ===== 背中 =====
  // 全体
  {
    name: "デッドリフト",
    bodyPart: "back",
    subGroup: "全体",
    tier: "initial",
    isBig3: true,
  },
  {
    name: "懸垂",
    bodyPart: "back",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  // 幅
  {
    name: "ラットプルダウン",
    bodyPart: "back",
    subGroup: "幅",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "リバースグリップラットプルダウン",
    bodyPart: "back",
    subGroup: "幅",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ワイドグリップチンニング",
    bodyPart: "back",
    subGroup: "幅",
    tier: "selectable",
    isBig3: false,
  },
  // 厚み
  {
    name: "バーベルローイング",
    bodyPart: "back",
    subGroup: "厚み",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "シーテッドロー",
    bodyPart: "back",
    subGroup: "厚み",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ワンハンドローイング",
    bodyPart: "back",
    subGroup: "厚み",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "T バーローイング",
    bodyPart: "back",
    subGroup: "厚み",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルローイング",
    bodyPart: "back",
    subGroup: "厚み",
    tier: "selectable",
    isBig3: false,
  },
  // 僧帽筋・下部
  {
    name: "ハイパーエクステンション",
    bodyPart: "back",
    subGroup: "僧帽筋・下部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "シュラッグ",
    bodyPart: "back",
    subGroup: "僧帽筋・下部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "フェイスプル",
    bodyPart: "back",
    subGroup: "僧帽筋・下部",
    tier: "selectable",
    isBig3: false,
  },

  // ===== 脚 =====
  // 大腿四頭筋
  {
    name: "スクワット",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: true,
  },
  {
    name: "レッグプレス",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "レッグエクステンション",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ブルガリアンスクワット",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "スプリットスクワット",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ランジ",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ステップアップ",
    bodyPart: "legs",
    subGroup: "大腿四頭筋",
    tier: "selectable",
    isBig3: false,
  },
  // ハムストリングス
  {
    name: "レッグカール",
    bodyPart: "legs",
    subGroup: "ハムストリングス",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ルーマニアンデッドリフト",
    bodyPart: "legs",
    subGroup: "ハムストリングス",
    tier: "selectable",
    isBig3: false,
  },
  // 臀筋
  {
    name: "ヒップスラスト",
    bodyPart: "legs",
    subGroup: "臀筋",
    tier: "selectable",
    isBig3: false,
  },
  // 下腿
  {
    name: "カーフレイズ",
    bodyPart: "legs",
    subGroup: "下腿",
    tier: "selectable",
    isBig3: false,
  },

  // ===== 肩 =====
  // 全体
  {
    name: "ダンベルショルダープレス",
    bodyPart: "shoulders",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ショルダープレス",
    bodyPart: "shoulders",
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ミリタリープレス",
    bodyPart: "shoulders",
    subGroup: "全体",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "アーノルドプレス",
    bodyPart: "shoulders",
    subGroup: "全体",
    tier: "selectable",
    isBig3: false,
  },
  // 前部
  {
    name: "フロントレイズ",
    bodyPart: "shoulders",
    subGroup: "前部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "バーベルフロントレイズ",
    bodyPart: "shoulders",
    subGroup: "前部",
    tier: "selectable",
    isBig3: false,
  },
  // 中部
  {
    name: "サイドレイズ",
    bodyPart: "shoulders",
    subGroup: "中部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ケーブルラテラルレイズ",
    bodyPart: "shoulders",
    subGroup: "中部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "アップライトロウ",
    bodyPart: "shoulders",
    subGroup: "中部",
    tier: "selectable",
    isBig3: false,
  },
  // 後部
  {
    name: "リアデルトフライ",
    bodyPart: "shoulders",
    subGroup: "後部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "リバースペックフライ",
    bodyPart: "shoulders",
    subGroup: "後部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルリアデルトフライ",
    bodyPart: "shoulders",
    subGroup: "後部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "フェイスプル",
    bodyPart: "shoulders",
    subGroup: "後部",
    tier: "selectable",
    isBig3: false,
  },

  // ===== 腕 =====
  // 上腕二頭筋
  {
    name: "バーベルカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "インクラインダンベルカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ダンベルハンマーカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "プリーチャーカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "コンセントレーションカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "リバースカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルカール",
    bodyPart: "arms",
    subGroup: "上腕二頭筋",
    tier: "selectable",
    isBig3: false,
  },
  // 上腕三頭筋
  {
    name: "トライセプスプッシュダウン",
    bodyPart: "arms",
    subGroup: "上腕三頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "スカルクラッシャー",
    bodyPart: "arms",
    subGroup: "上腕三頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ケーブルキックバック",
    bodyPart: "arms",
    subGroup: "上腕三頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ナローベンチプレス",
    bodyPart: "arms",
    subGroup: "上腕三頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "オーバーヘッドエクステンション",
    bodyPart: "arms",
    subGroup: "上腕三頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "クローズグリッププッシュアップ",
    bodyPart: "arms",
    subGroup: "上腕三頭筋",
    tier: "selectable",
    isBig3: false,
  },

  // ===== 腹筋 =====
  // 腹直筋
  {
    name: "クランチ",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "レッグレイズ",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "アブドミナルクランチ",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "シットアップベンチ",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "マウンテンクライマー",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ハンギングレッグレイズ",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "シットアップ",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  // 腹横筋
  {
    name: "プランク",
    bodyPart: "core",
    subGroup: "腹横筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "アブローラー",
    bodyPart: "core",
    subGroup: "腹横筋",
    tier: "selectable",
    isBig3: false,
  },
  // 腹斜筋
  {
    name: "ロータリートーソ",
    bodyPart: "core",
    subGroup: "腹斜筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "サイドプランク",
    bodyPart: "core",
    subGroup: "腹斜筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ロシアンツイスト",
    bodyPart: "core",
    subGroup: "腹斜筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "バイシクルクランチ",
    bodyPart: "core",
    subGroup: "腹斜筋",
    tier: "selectable",
    isBig3: false,
  },

  // ===== その他 =====
  // 有酸素
  {
    name: "ランニング",
    bodyPart: "other",
    subGroup: "有酸素",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "エアロバイク",
    bodyPart: "other",
    subGroup: "有酸素",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ローイングマシン",
    bodyPart: "other",
    subGroup: "有酸素",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ステアクライマー",
    bodyPart: "other",
    subGroup: "有酸素",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "クロストレーナー",
    bodyPart: "other",
    subGroup: "有酸素",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "スピンバイク",
    bodyPart: "other",
    subGroup: "有酸素",
    tier: "selectable",
    isBig3: false,
  },
];

// シードデータを生成
const seedExercisesData = seedExercises.map((exercise) => {
  const subGroup =
    resolveSubGroupForBodyPart(
      exercise.bodyPart as Parameters<typeof resolveSubGroupForBodyPart>[0],
      exercise.subGroup
    ) || null;
  const equipment = getEquipmentType(exercise.name);

  return {
    id: nanoid(10),
    name: exercise.name,
    nameEn: NAME_EN_MAP[exercise.name] || null,
    bodyPart: exercise.bodyPart,
    muscleSubGroup: subGroup,
    targetMuscleGroups: getTargetMuscleGroupsForSeedExercise(
      exercise,
      subGroup
    ),
    primaryEquipment: equipment,
    tier: exercise.tier,
    isBig3: exercise.isBig3,
    description: null,
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: [],
    userId: null,
  };
});

// シードデータを投入する関数
async function seed() {
  console.log("🌱 シードデータの投入を開始します...");

  try {
    // 既存のデータをクリア（開発環境のみ）
    console.log("📋 既存の種目データをクリアします...");
    await db.delete(exercises);

    // 新しいデータを投入
    console.log("✨ 新しい種目データを投入します...");
    await db.insert(exercises).values(seedExercisesData);

    console.log(`✅ ${seedExercisesData.length}件の種目を登録しました`);
    console.log("\n登録された種目:");
    console.log("  Big3: ベンチプレス、スクワット、デッドリフト");
    console.log(
      `  初期表示: ${
        seedExercisesData.filter((e) => e.tier === "initial").length
      }種目`
    );
    console.log(
      `  追加可能: ${
        seedExercisesData.filter((e) => e.tier === "selectable").length
      }種目`
    );
  } catch (error) {
    console.error("❌ シードデータの投入に失敗しました:", error);
    throw error;
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  seed()
    .then(() => {
      console.log("\n🎉 シードデータの投入が完了しました");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 エラーが発生しました:", error);
      process.exit(1);
    });
}

export { seed, seedExercisesData };
