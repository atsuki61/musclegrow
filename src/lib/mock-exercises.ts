import type { Exercise } from "@/types/workout";
import {
  SUB_GROUP_MAP,
  NAME_EN_MAP,
  getEquipmentType,
} from "./exercise-mappings";

// tier: "initial" の種目定義（種目.mdの星マーク）
const initialExercises = [
  // === 胸 ===
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
  {
    name: "インクラインダンベルプレス",
    bodyPart: "chest",
    subGroup: "上部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "デクラインプレス",
    bodyPart: "chest",
    subGroup: "下部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ディップス",
    bodyPart: "chest",
    subGroup: "下部",
    tier: "initial",
    isBig3: false,
  },
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
  // === 背中 ===
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
  {
    name: "ラットプルダウン",
    bodyPart: "back",
    subGroup: "幅",
    tier: "initial",
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
  // === 脚 ===
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
    name: "レッグカール",
    bodyPart: "legs",
    subGroup: "ハムストリングス",
    tier: "initial",
    isBig3: false,
  },
  // === 肩 ===
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
    name: "サイドレイズ",
    bodyPart: "shoulders",
    subGroup: "中部",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "リアデルトフライ",
    bodyPart: "shoulders",
    subGroup: "後部",
    tier: "initial",
    isBig3: false,
  },
  // === 腕 ===
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
  // === 腹筋 ===
  {
    name: "レッグレイズ",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "プランク",
    bodyPart: "core",
    subGroup: "腹横筋",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "ロータリートーソ",
    bodyPart: "core",
    subGroup: "腹斜筋",
    tier: "initial",
    isBig3: false,
  },
  // === その他 ===
  {
    name: "トレッドミル",
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
];

// tier: "selectable" の種目定義（種目.mdの☆なし種目）
const selectableExercises = [
  // === 胸 ===
  {
    name: "インクラインベンチプレス",
    bodyPart: "chest",
    subGroup: "上部",
    tier: "selectable",
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
  // === 背中 ===
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
  {
    name: "バーベルローイング",
    bodyPart: "back",
    subGroup: "厚み",
    tier: "selectable",
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
  // === 脚 ===
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
  {
    name: "ルーマニアンデッドリフト",
    bodyPart: "legs",
    subGroup: "ハムストリングス",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ヒップスラスト",
    bodyPart: "legs",
    subGroup: "臀筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ヒップスラスト",
    bodyPart: "legs",
    subGroup: "臀筋",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "カーフレイズ",
    bodyPart: "legs",
    subGroup: "下腿",
    tier: "selectable",
    isBig3: false,
  },
  // === 肩 ===
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
  // === 腕 ===
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
  // === 腹筋 ===
  {
    name: "クランチ",
    bodyPart: "core",
    subGroup: "腹直筋",
    tier: "selectable",
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
  {
    name: "アブローラー",
    bodyPart: "core",
    subGroup: "腹横筋",
    tier: "selectable",
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
  // === その他 ===
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
