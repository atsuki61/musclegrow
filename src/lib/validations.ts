import { z } from "zod";

/**
 * トレーニング部位のバリデーションスキーマ（"all"を除く）
 */
const bodyPartSchema = z.enum([
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "other",
]);

/**
 * 機材タイプのバリデーションスキーマ
 */
const equipmentTypeSchema = z.enum([
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "other",
]);

/**
 * 種目の表示階層のバリデーションスキーマ
 */
const exerciseTierSchema = z.enum(["initial", "selectable", "custom"]);

/**
 * 難易度レベルのバリデーションスキーマ
 */
const difficultyLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

/**
 * 種目（Exercise）のバリデーションスキーマ
 */
export const exerciseSchema = z.object({
  id: z.string().min(1, "IDは必須です"),
  name: z
    .string()
    .min(1, "種目名は必須です")
    .max(100, "種目名は100文字以内で入力してください"),
  nameEn: z
    .string()
    .max(100, "英語名は100文字以内で入力してください")
    .optional(),
  bodyPart: bodyPartSchema,
  muscleSubGroup: z
    .enum([
      "chest_overall",
      "chest_upper",
      "chest_lower",
      "chest_outer",
      "back_overall",
      "back_width",
      "back_thickness",
      "back_traps",
      "legs_quads",
      "legs_hamstrings",
      "legs_glutes",
      "legs_calves",
      "shoulders_overall",
      "shoulders_front",
      "shoulders_middle",
      "shoulders_rear",
      "arms_biceps",
      "arms_triceps",
      "core_rectus",
      "core_transverse",
      "core_obliques",
    ])
    .optional(),
  primaryEquipment: equipmentTypeSchema.optional(), // メインで使う器具。省略可能
  tier: exerciseTierSchema,                         // 種目の階層（初期・選択可能・カスタム）
  isBig3: z.boolean(),                              // ビッグ3（主要三種目）かどうか
  description: z                                   // 種目の説明文（省略可能）
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
videoUrl: z
  .url({ message: "有効なURLを入力してください" })
  .optional()
  .or(z.literal("")),
  difficultyLevel: difficultyLevelSchema.optional(),
  equipmentRequired: z.array(z.string()).optional(),
  userId: z.string().optional(),
  createdAt: z.date().optional(),
});

/**
 * セット記録（SetRecord）のバリデーションスキーマ
 * 時間ベース種目（プランクなど）の場合、durationがある場合はrepsを0以上に許可
 */
export const setRecordSchema = z
  .object({
    id: z.string().min(1, "IDは必須です"),
    setOrder: z
      .number()
      .int("セット順は整数で入力してください")
      .min(1, "セット順は1以上で入力してください"),
    weight: z
      .number()
      .nonnegative("重量は0以上で入力してください")
      .max(1000, "重量は1000kg以下で入力してください")
      .optional(),
    reps: z
      .number("回数は数値で入力してください")
      .int("回数は整数で入力してください")
      .min(0, "回数は0以上で入力してください")
      .max(1000, "回数は1000回以下で入力してください"),
    duration: z
      .number()
      .int("時間は整数で入力してください")
      .positive("時間は1秒以上で入力してください")
      .max(86400, "時間は86400秒（24時間）以下で入力してください")
      .nullable()
      .optional(),
    rpe: z
      .number()
      .min(1, "RPEは1以上で入力してください")
      .max(10, "RPEは10以下で入力してください")
      .nullable()
      .optional(),
    isWarmup: z.boolean().optional(),
    restSeconds: z
      .number()
      .int("休憩時間は整数で入力してください")
      .nonnegative("休憩時間は0以上で入力してください")
      .max(3600, "休憩時間は3600秒（1時間）以下で入力してください")
      .nullable()
      .optional(),
    notes: z
      .string()
      .max(500, "メモは500文字以内で入力してください")
      .nullable()
      .optional(),
    failure: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // durationがある場合（時間ベース種目）は、repsが0でもOK
      if (data.duration !== undefined && data.duration !== null && data.duration > 0) {
        return true;
      }
      // durationがない場合（通常の筋トレ種目）は、repsが1以上必要
      return data.reps >= 1;
    },
    {
      message: "回数は1回以上で入力してください（時間ベース種目を除く）",
      path: ["reps"],
    }
  );

/**
 * 有酸素種目の記録（CardioRecord）のバリデーションスキーマ
 */
export const cardioRecordSchema = z.object({
  id: z.string().min(1, "IDは必須です"),
  duration: z
    .number()
    .int("時間は整数で入力してください")
    .min(1, "時間は1分以上で入力してください")
    .max(1440, "時間は1440分（24時間）以下で入力してください"),
  distance: z
    .number()
    .nonnegative("距離は0以上で入力してください")
    .max(1000, "距離は1000km以下で入力してください")
    .nullable()
    .optional(),
  speed: z
    .number()
    .nonnegative("速度は0以上で入力してください")
    .max(100, "速度は100km/h以下で入力してください")
    .nullable()
    .optional(),
  calories: z
    .number()
    .int("消費カロリーは整数で入力してください")
    .nonnegative("消費カロリーは0以上で入力してください")
    .max(10000, "消費カロリーは10000kcal以下で入力してください")
    .nullable()
    .optional(),
  heartRate: z
    .number()
    .int("心拍数は整数で入力してください")
    .min(30, "心拍数は30bpm以上で入力してください")
    .max(250, "心拍数は250bpm以下で入力してください")
    .nullable()
    .optional(),
  incline: z
    .number()
    .nonnegative("傾斜は0以上で入力してください")
    .max(100, "傾斜は100%以下で入力してください")
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(500, "メモは500文字以内で入力してください")
    .nullable()
    .optional(),
  date: z.date(),
});

/**
 * ワークアウトセッションのバリデーションスキーマ
 */
export const workoutSessionSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で入力してください"),
  note: z
    .string()
    .max(1000, "メモは1000文字以内で入力してください")
    .nullable()
    .optional(),
  durationMinutes: z
    .number()
    .int("時間は整数で入力してください")
    .nonnegative("時間は0以上で入力してください")
    .max(1440, "時間は1440分（24時間）以下で入力してください")
    .nullable()
    .optional(),
});

/**
 * プロフィール更新のバリデーションスキーマ
 */
export const updateProfileSchema = z.object({
  height: z
    .number()
    .min(100, "身長は100cm以上で入力してください")
    .max(250, "身長は250cm以下で入力してください")
    .optional(),
  weight: z
    .number()
    .min(30, "体重は30kg以上で入力してください")
    .max(300, "体重は300kg以下で入力してください")
    .optional(),
  bodyFat: z
    .number()
    .min(0, "体脂肪率は0%以上で入力してください")
    .max(100, "体脂肪率は100%以下で入力してください")
    .optional(),
  muscleMass: z
    .number()
    .min(0, "筋肉量は0kg以上で入力してください")
    .max(150, "筋肉量は150kg以下で入力してください")
    .optional(),
  big3TargetBenchPress: z
    .number()
    .min(0, "ベンチプレスの目標重量は0kg以上で入力してください")
    .max(1000, "ベンチプレスの目標重量は1000kg以下で入力してください")
    .optional(),
  big3TargetSquat: z
    .number()
    .min(0, "スクワットの目標重量は0kg以上で入力してください")
    .max(1000, "スクワットの目標重量は1000kg以下で入力してください")
    .optional(),
  big3TargetDeadlift: z
    .number()
    .min(0, "デッドリフトの目標重量は0kg以上で入力してください")
    .max(1000, "デッドリフトの目標重量は1000kg以下で入力してください")
    .optional(),
});

/**
 * バリデーションエラーメッセージを取得するヘルパー関数
 */
export function getValidationErrorMessage(error: z.ZodError): string {
  const firstError = error.issues[0];
  return firstError?.message || "バリデーションエラーが発生しました";
}

/**
 * バリデーションエラーの詳細を取得するヘルパー関数
 */
export function getValidationErrorDetails(
  error: z.ZodError
): Record<string, string> {
  const details: Record<string, string> = {};
  error.issues.forEach((err) => {
    const path = err.path.join(".");
    details[path] = err.message;
  });
  return details;
}

/**
 * 配列の各要素をバリデーションし、無効な要素のインデックスを返す
 * @param items バリデーション対象の配列
 * @param schema Zodスキーマ
 * @param itemName アイテム名（エラーログ用）
 * @returns 無効な要素のインデックス配列（1ベース）
 */
export function validateItems<T>(
  items: T[],
  schema: z.ZodSchema<T>,
  itemName: string
): number[] {
  const invalidIndices: number[] = [];
  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      invalidIndices.push(index + 1);
      // エラー詳細を取得
      const errorDetails = getValidationErrorDetails(result.error);
      // エラー詳細が空でない場合のみログを出力（開発環境のみ）
      if (
        Object.keys(errorDetails).length > 0 &&
        process.env.NODE_ENV === "development"
      ) {
        console.error(
          `${itemName}${index + 1}のバリデーションエラー:`,
          errorDetails
        );
        console.error(
          `${itemName}${index + 1}のデータ:`,
          JSON.stringify(item, null, 2)
        );
      }
    }
  });
  return invalidIndices;
}
