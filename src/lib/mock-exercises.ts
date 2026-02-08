import type { Exercise } from "@/types/workout";
import {
  SUB_GROUP_MAP,
  NAME_EN_MAP,
  getEquipmentType,
} from "./exercise-mappings";
import { BODY_PARTS } from "@/constants/body-parts";

// tier: "initial" の種目定義（種目.mdの星マーク）
const initialExercises = [
  // === 胸 ===
  {
    name: "ベンチプレス",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "全体",
    tier: "initial",
    isBig3: true,
  },
  {
    name: "ダンベルプレス",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "チェストプレス",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "インクラインダンベルプレス",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "上部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "デクラインプレス",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "下部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ディップス",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "下部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ダンベルフライ",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "外側",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ペックフライ",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "外側",
    tier: "initial",
    isBig3: false,
  },
  // === 背中 ===
  {
    name: "デッドリフト",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "全体",
    tier: "initial",
    isBig3: true,
  },
  {
    name: "懸垂",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ラットプルダウン",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "幅",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "シーテッドロー",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "厚み",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ワンハンドローイング",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "厚み",
    tier: "initial",
    isBig3: false,
  },
  // === 脚 ===
  {
    name: "スクワット",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: true,
  },
  {
    name: "レッグプレス",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "レッグエクステンション",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ブルガリアンスクワット",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "大腿四頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "レッグカール",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "ハムストリングス",
    tier: "initial",
    isBig3: false,
  },
  // === 肩 ===
  {
    name: "ダンベルショルダープレス",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ショルダープレス",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "全体",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "サイドレイズ",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "中部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "リアデルトフライ",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "後部",
    tier: "initial",
    isBig3: false,
  },
  // === 腕 ===
  {
    name: "バーベルカール",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕二頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "インクラインダンベルカール",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕二頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ダンベルハンマーカール",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕二頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "トライセプスプッシュダウン",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕三頭筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "スカルクラッシャー",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕三頭筋",
    tier: "initial",
    isBig3: false,
  },
  // === 腹筋 ===
  {
    name: "レッグレイズ",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹直筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "プランク",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹横筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ロータリートーソ",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹斜筋",
    tier: "initial",
    isBig3: false,
  },
  // === その他 ===
  {
    name: "トレッドミル",
    bodyPart: BODY_PARTS.OTHER,
    subGroup: "有酸素",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "エアロバイク",
    bodyPart: BODY_PARTS.OTHER,
    subGroup: "有酸素",
    tier: "initial",
    isBig3: false,
  },
];

// tier: "selectable" の種目定義（種目.mdの☆なし種目）
const selectableExercises = [
  // === 胸 ===
  {
    name: "インクラインベンチプレス",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "上部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "デクラインベンチプレス",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "下部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルフライ",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "外側",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルクロスオーバー",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "外側",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "プッシュアップ",
    bodyPart: BODY_PARTS.CHEST,
    subGroup: "外側",
    tier: "selectable",
    isBig3: false,
  },
  // === 背中 ===
  {
    name: "リバースグリップラットプルダウン",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "幅",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ワイドグリップチンニング",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "幅",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "バーベルローイング",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "厚み",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "T バーローイング",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "厚み",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルローイング",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "厚み",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ハイパーエクステンション",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "僧帽筋・下部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "シュラッグ",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "僧帽筋・下部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "フェイスプル",
    bodyPart: BODY_PARTS.BACK,
    subGroup: "僧帽筋・下部",
    tier: "selectable",
    isBig3: false,
  },
  // === 脚 ===
  {
    name: "スプリットスクワット",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "大腿四頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ランジ",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "大腿四頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ステップアップ",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "大腿四頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ルーマニアンデッドリフト",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "ハムストリングス",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ヒップスラスト",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "臀筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ヒップスラスト",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "臀筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "カーフレイズ",
    bodyPart: BODY_PARTS.LEGS,
    subGroup: "下腿",
    tier: "selectable",
    isBig3: false,
  },
  // === 肩 ===
  {
    name: "ミリタリープレス",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "全体",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "アーノルドプレス",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "全体",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "フロントレイズ",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "前部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "バーベルフロントレイズ",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "前部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルラテラルレイズ",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "中部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "アップライトロウ",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "中部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "リバースペックフライ",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "後部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルリアデルトフライ",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "後部",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "フェイスプル",
    bodyPart: BODY_PARTS.SHOULDERS,
    subGroup: "後部",
    tier: "selectable",
    isBig3: false,
  },
  // === 腕 ===
  {
    name: "プリーチャーカール",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕二頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "コンセントレーションカール",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕二頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "リバースカール",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕二頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルカール",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕二頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケーブルキックバック",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕三頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ナローベンチプレス",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕三頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "オーバーヘッドエクステンション",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕三頭筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "クローズグリッププッシュアップ",
    bodyPart: BODY_PARTS.ARMS,
    subGroup: "上腕三頭筋",
    tier: "selectable",
    isBig3: false,
  },
  // === 腹筋 ===
  {
    name: "クランチ",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "アブドミナルクランチ",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "シットアップベンチ",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "マウンテンクライマー",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ハンギングレッグレイズ",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "シットアップ",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹直筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "アブローラー",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹横筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "サイドプランク",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹斜筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ロシアンツイスト",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹斜筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "バイシクルクランチ",
    bodyPart: BODY_PARTS.CORE,
    subGroup: "腹斜筋",
    tier: "selectable",
    isBig3: false,
  },
  // === その他 ===
  {
    name: "ローイングマシン",
    bodyPart: BODY_PARTS.OTHER,
    subGroup: "有酸素",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ステアクライマー",
    bodyPart: BODY_PARTS.OTHER,
    subGroup: "有酸素",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "クロストレーナー",
    bodyPart: BODY_PARTS.OTHER,
    subGroup: "有酸素",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "スピンバイク",
    bodyPart: BODY_PARTS.OTHER,
    subGroup: "有酸素",
    tier: "selectable",
    isBig3: false,
  },
];

// 種目データを生成する共通関数
const createExercise = (
  exercise: {
    name: string;
    bodyPart: string;
    subGroup: string;
    tier: string;
    isBig3: boolean;
  },
  index: number,
  offset: number = 0
): Exercise => {
  const subGroup = SUB_GROUP_MAP[exercise.subGroup] || undefined;
  const equipment = getEquipmentType(exercise.name);

  return {
    id: `mock-${offset + index + 1}`,
    name: exercise.name,
    nameEn: NAME_EN_MAP[exercise.name],
    bodyPart: exercise.bodyPart as Exercise["bodyPart"],
    muscleSubGroup: subGroup as Exercise["muscleSubGroup"],
    primaryEquipment: equipment,
    tier: exercise.tier as Exercise["tier"],
    isBig3: exercise.isBig3,
  };
};

// ダミーデータを生成（Exercise型に変換）
export const mockInitialExercises: Exercise[] = [
  ...initialExercises.map((exercise, index) =>
    createExercise(exercise, index, 0)
  ),
  ...selectableExercises.map((exercise, index) =>
    createExercise(exercise, index, initialExercises.length)
  ),
];
