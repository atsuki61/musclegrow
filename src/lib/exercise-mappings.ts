import type { Exercise, MuscleSubGroup } from "@/types/workout";

/**
 * サブ分類のマッピング（日本語名 → DB用の値）
 * mock-exercises.ts と seed.ts で共通使用
 */
export const SUB_GROUP_MAP: Record<string, string> = {
  全体: "chest_overall",
  上部: "chest_upper",
  下部: "chest_lower",
  外側: "chest_outer",
  幅: "back_width",
  厚み: "back_thickness",
  "僧帽筋・下部": "back_traps",
  大腿四頭筋: "legs_quads",
  ハムストリングス: "legs_hamstrings",
  臀筋: "legs_glutes",
  下腿: "legs_calves",
  前部: "shoulders_front",
  中部: "shoulders_middle",
  後部: "shoulders_rear",
  上腕二頭筋: "arms_biceps",
  上腕三頭筋: "arms_triceps",
  腹直筋: "core_rectus",
  腹横筋: "core_transverse",
  腹斜筋: "core_obliques",
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

/**
 * サブ分類のラベル定義（DB用の値 → 日本語ラベル）
 * body-part-card.tsx で使用
 */
export const MUSCLE_SUB_GROUP_LABELS: Record<MuscleSubGroup, string> = {
  // 胸
  chest_overall: "全体",
  chest_upper: "上部",
  chest_lower: "下部",
  chest_outer: "外側",
  // 背中
  back_overall: "全体",
  back_width: "幅",
  back_thickness: "厚み",
  back_traps: "僧帽筋・下部（首の付け根～肩）",
  // 脚
  legs_quads: "大腿四頭筋（太ももの前側）",
  legs_hamstrings: "ハムストリングス（太ももの後側）",
  legs_glutes: "臀筋（お尻）",
  legs_calves: "下腿（ふくらはぎ）",
  // 肩
  shoulders_overall: "全体",
  shoulders_front: "前部",
  shoulders_middle: "中部",
  shoulders_rear: "後部",
  // 腕
  arms_biceps: "上腕二頭筋（力こぶ）",
  arms_triceps: "上腕三頭筋（二の腕の後ろ）",
  // 腹筋
  core_rectus: "腹直筋（お腹の前側）",
  core_transverse: "腹横筋（お腹の深い部分）",
  core_obliques: "腹斜筋（お腹の横側）",
};
