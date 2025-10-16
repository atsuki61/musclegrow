import { nanoid } from "nanoid";
import { db } from "./index";
import { exercises } from "./schemas/app";

// Big3と主要種目のシードデータ
const seedExercises = [
  // ===== Big3 =====
  {
    id: nanoid(10),
    name: "ベンチプレス",
    nameEn: "Bench Press",
    bodyPart: "chest",
    isBig3: true,
    description: "胸を鍛える基本種目。バーベルを胸まで下ろして押し上げる",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["バーベル", "ベンチ"],
    userId: null, // 共通マスタ
  },
  {
    id: nanoid(10),
    name: "スクワット",
    nameEn: "Squat",
    bodyPart: "legs",
    isBig3: true,
    description: "脚全体を鍛える基本種目。バーベルを担いでしゃがみ込む",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["バーベル", "スクワットラック"],
    userId: null,
  },
  {
    id: nanoid(10),
    name: "デッドリフト",
    nameEn: "Deadlift",
    bodyPart: "back",
    isBig3: true,
    description: "背中・脚・全身を鍛える基本種目。床からバーベルを持ち上げる",
    videoUrl: null,
    difficultyLevel: "intermediate",
    equipmentRequired: ["バーベル"],
    userId: null,
  },

  // ===== 胸 =====
  {
    id: nanoid(10),
    name: "インクラインベンチプレス",
    nameEn: "Incline Bench Press",
    bodyPart: "chest",
    isBig3: false,
    description: "大胸筋上部を重点的に鍛える。ベンチを30-45度に傾ける",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["バーベル", "インクラインベンチ"],
    userId: null,
  },
  {
    id: nanoid(10),
    name: "ダンベルフライ",
    nameEn: "Dumbbell Fly",
    bodyPart: "chest",
    isBig3: false,
    description: "大胸筋のストレッチを重視した種目。ダンベルを広げて下ろす",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["ダンベル", "ベンチ"],
    userId: null,
  },

  // ===== 背中 =====
  {
    id: nanoid(10),
    name: "ラットプルダウン",
    nameEn: "Lat Pulldown",
    bodyPart: "back",
    isBig3: false,
    description: "広背筋を鍛える基本種目。上から引き下ろす動作",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["ラットプルマシン"],
    userId: null,
  },
  {
    id: nanoid(10),
    name: "ベントオーバーロウ",
    nameEn: "Bent Over Row",
    bodyPart: "back",
    isBig3: false,
    description: "背中の厚みを作る種目。前傾姿勢でバーベルを引き上げる",
    videoUrl: null,
    difficultyLevel: "intermediate",
    equipmentRequired: ["バーベル"],
    userId: null,
  },

  // ===== 脚 =====
  {
    id: nanoid(10),
    name: "レッグプレス",
    nameEn: "Leg Press",
    bodyPart: "legs",
    isBig3: false,
    description: "大腿四頭筋を鍛える基本種目。マシンで足を押し出す",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["レッグプレスマシン"],
    userId: null,
  },
  {
    id: nanoid(10),
    name: "レッグカール",
    nameEn: "Leg Curl",
    bodyPart: "legs",
    isBig3: false,
    description: "ハムストリングスを鍛える種目。膝を曲げる動作",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["レッグカールマシン"],
    userId: null,
  },

  // ===== 肩 =====
  {
    id: nanoid(10),
    name: "ショルダープレス",
    nameEn: "Shoulder Press",
    bodyPart: "shoulders",
    isBig3: false,
    description: "三角筋全体を鍛える基本種目。バーベルを頭上に押し上げる",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["バーベル", "ベンチ"],
    userId: null,
  },
  {
    id: nanoid(10),
    name: "サイドレイズ",
    nameEn: "Side Raise",
    bodyPart: "shoulders",
    isBig3: false,
    description: "三角筋中部を鍛える種目。ダンベルを横に上げる",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["ダンベル"],
    userId: null,
  },

  // ===== 腕 =====
  {
    id: nanoid(10),
    name: "バーベルカール",
    nameEn: "Barbell Curl",
    bodyPart: "arms",
    isBig3: false,
    description: "上腕二頭筋を鍛える基本種目。バーベルを巻き上げる",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["バーベル"],
    userId: null,
  },
  {
    id: nanoid(10),
    name: "トライセプスエクステンション",
    nameEn: "Triceps Extension",
    bodyPart: "arms",
    isBig3: false,
    description: "上腕三頭筋を鍛える種目。肘を伸ばす動作",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: ["ダンベル"],
    userId: null,
  },

  // ===== 体幹・腹筋 =====
  {
    id: nanoid(10),
    name: "プランク",
    nameEn: "Plank",
    bodyPart: "core",
    isBig3: false,
    description: "体幹全体を鍛える基本種目。板のように身体を真っ直ぐに保つ",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: [],
    userId: null,
  },
  {
    id: nanoid(10),
    name: "クランチ",
    nameEn: "Crunch",
    bodyPart: "core",
    isBig3: false,
    description: "腹直筋を鍛える基本種目。上体を丸めて起こす",
    videoUrl: null,
    difficultyLevel: "beginner",
    equipmentRequired: [],
    userId: null,
  },
];

// シードデータを投入する関数
async function seed() {
  console.log("🌱 シードデータの投入を開始します...");

  try {
    // 既存のデータをクリア（開発環境のみ）
    console.log("📋 既存の種目データをクリアします...");
    await db.delete(exercises);

    // 新しいデータを投入
    console.log("✨ 新しい種目データを投入します...");
    await db.insert(exercises).values(seedExercises);

    console.log(`✅ ${seedExercises.length}件の種目を登録しました`);
    console.log("\n登録された種目:");
    console.log("  Big3: ベンチプレス、スクワット、デッドリフト");
    console.log("  胸: インクラインベンチプレス、ダンベルフライ");
    console.log("  背中: ラットプルダウン、ベントオーバーロウ");
    console.log("  脚: レッグプレス、レッグカール");
    console.log("  肩: ショルダープレス、サイドレイズ");
    console.log("  腕: バーベルカール、トライセプスエクステンション");
    console.log("  体幹: プランク、クランチ");
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

export { seed, seedExercises };
