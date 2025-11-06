import { nanoid } from "nanoid";
import { db } from "./index";
import { exercises } from "./schemas/app";

// サブ分類のマッピング
const SUB_GROUP_MAP: Record<string, string> = {
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

// 機材タイプのマッピング
function getEquipmentType(name: string): string {
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

// 英語名のマッピング
const NAME_EN_MAP: Record<string, string> = {
  ベンチプレス: "Bench Press",
  ダンベルプレス: "Dumbbell Press",
  チェストプレス: "Chest Press",
  インクラインダンベルプレス: "Incline Dumbbell Press",
  "インクラインベンチプレス（バーベル）": "Incline Bench Press",
  デクラインプレス: "Decline Press",
  "デクラインベンチプレス（バーベル）": "Decline Bench Press",
  ディップス: "Dips",
  ダンベルフライ: "Dumbbell Fly",
  ペックフライ: "Pec Fly",
  ケーブルフライ: "Cable Fly",
  ケーブルクロスオーバー: "Cable Crossover",
  "プッシュアップ（腕立て伏せ）": "Push-up",
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
  "ヒップスラスト（バーベル）": "Barbell Hip Thrust",
  カーフレイズ: "Calf Raise",
  ダンベルショルダープレス: "Dumbbell Shoulder Press",
  "ショルダープレス（スミス）": "Smith Machine Shoulder Press",
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
  プリーチャーカール: "Preacher Curl",
  コンセントレーションカール: "Concentration Curl",
  リバースカール: "Reverse Curl",
  ケーブルカール: "Cable Curl",
  トライセプスプッシュダウン: "Triceps Pushdown",
  スカルクラッシャー: "Skull Crusher",
  ケーブルキックバック: "Cable Kickback",
  ナローベンチプレス: "Close Grip Bench Press",
  オーバーヘッドエクステンション: "Overhead Extension",
  "ディップス（三頭筋）": "Triceps Dips",
  クローズグリッププッシュアップ: "Close Grip Push-up",
  クランチ: "Crunch",
  レッグレイズ: "Leg Raise",
  アブドミナルクランチ: "Abdominal Crunch",
  シットアップベンチ: "Sit-up Bench",
  マウンテンクライマー: "Mountain Climber",
  ハンギングレッグレイズ: "Hanging Leg Raise",
  シットアップ: "Sit-up",
  プランク: "Plank",
  アブローラー: "Ab Roller",
  ロータリートーソ: "Russian Twist",
  サイドプランク: "Side Plank",
  ロシアンツイスト: "Russian Twist",
  バイシクルクランチ: "Bicycle Crunch",
  "ランニング（トレッドミル／屋外）": "Running",
  "エアロバイク（バイク）": "Exercise Bike",
  ローイングマシン: "Rowing Machine",
  ステアクライマー: "Stair Climber",
  クロストレーナー: "Elliptical",
  スピンバイク: "Spin Bike",
  バーピー: "Burpee",
  ケトルベルスイング: "Kettlebell Swing",
};

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
    name: "インクラインベンチプレス（バーベル）",
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
    name: "デクラインベンチプレス（バーベル）",
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
    name: "プッシュアップ（腕立て伏せ）",
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
  {
    name: "ヒップスラスト（バーベル）",
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
    name: "ショルダープレス（スミス）",
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
    name: "ディップス（三頭筋）",
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
    name: "ランニング（トレッドミル／屋外）",
    bodyPart: "other",
    subGroup: "有酸素",
    tier: "initial",
    isBig3: false,
  },
  {
    name: "エアロバイク（バイク）",
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
  // その他の全身運動
  {
    name: "バーピー",
    bodyPart: "other",
    subGroup: "その他の全身運動",
    tier: "selectable",
    isBig3: false,
  },
  {
    name: "ケトルベルスイング",
    bodyPart: "other",
    subGroup: "その他の全身運動",
    tier: "selectable",
    isBig3: false,
  },
];

// シードデータを生成
const seedExercisesData = seedExercises.map((exercise) => {
  const subGroup = SUB_GROUP_MAP[exercise.subGroup] || null;
  const equipment = getEquipmentType(exercise.name);

  return {
    id: nanoid(10),
    name: exercise.name,
    nameEn: NAME_EN_MAP[exercise.name] || null,
    bodyPart: exercise.bodyPart,
    muscleSubGroup: subGroup,
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
