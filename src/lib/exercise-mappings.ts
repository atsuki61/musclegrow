import type { Exercise } from "@/types/workout";
import {
  MUSCLE_SUB_GROUPS,
  MUSCLE_SUB_GROUP_LABELS,
} from "@/constants/body-parts";

export { MUSCLE_SUB_GROUP_LABELS };

/**
 * サブ分類のマッピング（日本語名 → DB用の値）
 * mock-exercises.ts と seed.ts で共通使用
 */
export const SUB_GROUP_MAP: Record<string, string> = {
  全体: MUSCLE_SUB_GROUPS.CHEST_OVERALL,
  上部: MUSCLE_SUB_GROUPS.CHEST_UPPER,
  下部: MUSCLE_SUB_GROUPS.CHEST_LOWER,
  外側: MUSCLE_SUB_GROUPS.CHEST_OUTER,
  幅: MUSCLE_SUB_GROUPS.BACK_WIDTH,
  厚み: MUSCLE_SUB_GROUPS.BACK_THICKNESS,
  "僧帽筋・下部": MUSCLE_SUB_GROUPS.BACK_TRAPS,
  大腿四頭筋: MUSCLE_SUB_GROUPS.LEGS_QUADS,
  ハムストリングス: MUSCLE_SUB_GROUPS.LEGS_HAMSTRINGS,
  臀筋: MUSCLE_SUB_GROUPS.LEGS_GLUTES,
  下腿: MUSCLE_SUB_GROUPS.LEGS_CALVES,
  前部: MUSCLE_SUB_GROUPS.SHOULDERS_FRONT,
  中部: MUSCLE_SUB_GROUPS.SHOULDERS_MIDDLE,
  後部: MUSCLE_SUB_GROUPS.SHOULDERS_REAR,
  上腕二頭筋: MUSCLE_SUB_GROUPS.ARMS_BICEPS,
  上腕三頭筋: MUSCLE_SUB_GROUPS.ARMS_TRICEPS,
  腹直筋: MUSCLE_SUB_GROUPS.CORE_RECTUS,
  腹横筋: MUSCLE_SUB_GROUPS.CORE_TRANSVERSE,
  腹斜筋: MUSCLE_SUB_GROUPS.CORE_OBLIQUES,
};

/**
 * 機材タイプを判定する関数
 * 種目名から機材タイプを推測
 * @param name 種目名
 * @returns 機材タイプ
 */
export function getEquipmentType(name: string): Exercise["primaryEquipment"] {
  if (name.includes("バーベル") || name.includes("BB")) return "barbell";
  if (name.includes("ダンベル") || name.includes("DB")) return "dumbbell";
  if (
    name.includes("マシン") ||
    name.includes("スミス") ||
    name.includes("チェストプレス") ||
    name.includes("レッグ")
  )
    return "machine";
  if (name.includes("ケーブル") || name.includes("C")) return "cable";
  if (
    name.includes("自重") ||
    name.includes("ディップス") ||
    name.includes("プッシュアップ") ||
    name.includes("プランク") ||
    name.includes("クランチ") ||
    name.includes("レイズ") ||
    name.includes("懸垂") ||
    name.includes("バーピー")
  )
    return "bodyweight";
  if (name.includes("ケトルベル")) return "kettlebell";
  if (
    name.includes("ランニング") ||
    name.includes("バイク") ||
    name.includes("トレッドミル") ||
    name.includes("エアロ") ||
    name.includes("ローイング") ||
    name.includes("ステア") ||
    name.includes("クロス")
  )
    return "machine";
  return "other";
}

/**
 * 英語名のマッピング（日本語名 → 英語名）
 * mock-exercises.ts と seed.ts で共通使用
 */
export const NAME_EN_MAP: Record<string, string> = {
  ベンチプレス: "Bench Press",
  ダンベルプレス: "Dumbbell Press",
  チェストプレス: "Chest Press",
  インクラインダンベルプレス: "Incline Dumbbell Press",
  インクラインベンチプレス: "Incline Bench Press",
  デクラインプレス: "Decline Press",
  デクラインベンチプレス: "Decline Bench Press",
  ディップス: "Dips",
  ダンベルフライ: "Dumbbell Fly",
  ペックフライ: "Pec Fly",
  ケーブルフライ: "Cable Fly",
  ケーブルクロスオーバー: "Cable Crossover",
  プッシュアップ: "Push-up",
  デッドリフト: "Deadlift",
  懸垂: "Chin-up",
  ラットプルダウン: "Lat Pulldown",
  リバースグリップラットプルダウン: "Reverse Grip Lat Pulldown",
  ワイドグリップチンニング: "Wide Grip Chin-up",
  バーベルローイング: "Barbell Row",
  シーテッドロー: "Seated Row",
  ワンハンドローイング: "One Hand Row",
  "T バーローイング": "T-Bar Row",
  ケーブルローイング: "Cable Row",
  ハイパーエクステンション: "Hyperextension",
  シュラッグ: "Shrug",
  フェイスプル: "Face Pull",
  スクワット: "Squat",
  レッグプレス: "Leg Press",
  レッグエクステンション: "Leg Extension",
  ブルガリアンスクワット: "Bulgarian Squat",
  スプリットスクワット: "Split Squat",
  ランジ: "Lunge",
  ステップアップ: "Step-up",
  レッグカール: "Leg Curl",
  ルーマニアンデッドリフト: "Romanian Deadlift",
  ヒップスラスト: "Hip Thrust",
  カーフレイズ: "Calf Raise",
  ダンベルショルダープレス: "Dumbbell Shoulder Press",
  ショルダープレス: "Shoulder Press",
  ミリタリープレス: "Military Press",
  アーノルドプレス: "Arnold Press",
  フロントレイズ: "Front Raise",
  バーベルフロントレイズ: "Barbell Front Raise",
  サイドレイズ: "Side Raise",
  ケーブルラテラルレイズ: "Cable Lateral Raise",
  アップライトロウ: "Upright Row",
  リアデルトフライ: "Rear Delt Fly",
  リバースペックフライ: "Reverse Pec Fly",
  ケーブルリアデルトフライ: "Cable Rear Delt Fly",
  バーベルカール: "Barbell Curl",
  インクラインダンベルカール: "Incline Dumbbell Curl",
  ダンベルハンマーカール: "Dumbbell Hammer Curl",
  トライセプスプッシュダウン: "Triceps Pushdown",
  スカルクラッシャー: "Skull Crusher",
  プリーチャーカール: "Preacher Curl",
  コンセントレーションカール: "Concentration Curl",
  リバースカール: "Reverse Curl",
  ケーブルカール: "Cable Curl",
  ケーブルキックバック: "Cable Kickback",
  ナローベンチプレス: "Close Grip Bench Press",
  オーバーヘッドエクステンション: "Overhead Extension",
  クローズグリッププッシュアップ: "Close Grip Push-up",
  レッグレイズ: "Leg Raise",
  プランク: "Plank",
  ロータリートーソ: "Russian Twist",
  クランチ: "Crunch",
  アブドミナルクランチ: "Abdominal Crunch",
  シットアップベンチ: "Sit-up Bench",
  マウンテンクライマー: "Mountain Climber",
  ハンギングレッグレイズ: "Hanging Leg Raise",
  シットアップ: "Sit-up",
  アブローラー: "Ab Roller",
  サイドプランク: "Side Plank",
  ロシアンツイスト: "Russian Twist",
  バイシクルクランチ: "Bicycle Crunch",
  トレッドミル: "Treadmill",
  ランニング: "Running",
  エアロバイク: "Exercise Bike",
  ローイングマシン: "Rowing Machine",
  ステアクライマー: "Stair Climber",
  クロストレーナー: "Cross Trainer",
  スピンバイク: "Spin Bike",
};


