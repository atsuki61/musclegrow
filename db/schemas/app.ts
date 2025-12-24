import {
  pgTable, //テーブルを作成するための関数
  text, //テキスト型のカラムを作成するための関数
  numeric, //数値型のカラムを作成するための関数
  timestamp, //日時型のカラムを作成するための関数
  date, //日付型のカラムを作成するための関数
  integer, //整数型のカラムを作成するための関数
  boolean, //真偽型のカラムを作成するための関数
  index, //インデックスを作成するための関数
  primaryKey, //複合主キーを作成するための関数
} from "drizzle-orm/pg-core"; //
import { nanoid } from "nanoid"; //ランダムな文字列を生成するための関数
import { users } from "./auth";

// ① profiles テーブル - ユーザーのプロフィール情報
export const profiles = pgTable(
  "profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid(10)),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }) //
      .unique(),
    height: numeric("height", { precision: 5, scale: 2 }), // 身長（cm）
    weight: numeric("weight", { precision: 5, scale: 2 }), // 体重（kg）
    bodyFat: numeric("body_fat", { precision: 4, scale: 1 }), // 体脂肪率（%）
    muscleMass: numeric("muscle_mass", { precision: 5, scale: 2 }), // 筋肉量（kg）
    big3TargetBenchPress: numeric("big3_target_bench_press", {
      precision: 6,
      scale: 1,
    }), // ベンチプレスの目標重量（kg）例: 100.0
    big3TargetSquat: numeric("big3_target_squat", { precision: 6, scale: 1 }), // スクワットの目標重量（kg）例: 120.0
    big3TargetDeadlift: numeric("big3_target_deadlift", {
      precision: 6,
      scale: 1,
    }), // デッドリフトの目標重量（kg）例: 140.0
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  // TODO: pgTableの第3引数（extraConfig）が非推奨のため、インデックスをテーブル定義の外に移動する必要がある
  // 修正方法: インデックスを別途定義する（例: export const profilesUserIdIdx = index(...).on(profiles.userId)）
  (table) => ({
    profilesUserIdIdx: index("profiles_user_id_idx").on(table.userId),
  })
);

// ①-2 profile_history テーブル - プロフィール履歴（グラフ用）
export const profileHistory = pgTable(
  "profile_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid(10)),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    height: numeric("height", { precision: 5, scale: 2 }), // 身長（cm）
    weight: numeric("weight", { precision: 5, scale: 2 }), // 体重（kg）
    bodyFat: numeric("body_fat", { precision: 4, scale: 1 }), // 体脂肪率（%）
    muscleMass: numeric("muscle_mass", { precision: 5, scale: 2 }), // 筋肉量（kg）
    bmi: numeric("bmi", { precision: 4, scale: 1 }), // BMI（計算値）
    recordedAt: timestamp("recorded_at").defaultNow().notNull(), // 記録日時
  },
  // TODO: pgTableの第3引数（extraConfig）が非推奨のため、インデックスをテーブル定義の外に移動する必要がある
  // 修正方法: インデックスを別途定義する（例: export const profileHistoryUserIdIdx = index(...).on(profileHistory.userId)）
  (table) => ({
    profileHistoryUserIdIdx: index("profile_history_user_id_idx").on(
      table.userId
    ),
    profileHistoryDateIdx: index("profile_history_date_idx").on(
      table.recordedAt
    ),
  })
);

// ② exercises テーブル - 種目マスタ（共通マスタ + ユーザー独自種目）
export const exercises = pgTable("exercises", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  name: text("name").notNull(), // 種目名（例: "ベンチプレス"）
  nameEn: text("name_en"), // 英語名（例: "Bench Press"）
  bodyPart: text("body_part").notNull(), // 部位: chest, back, legs, shoulders, arms, core, other
  muscleSubGroup: text("muscle_sub_group"), // サブ分類（例: "chest_overall", "legs_quads"）
  primaryEquipment: text("primary_equipment"), // 主要機材: barbell, dumbbell, machine, cable, bodyweight, kettlebell
  tier: text("tier").default("selectable").notNull(), // 表示階層: initial（初期）, selectable（リストに表示）, custom（カスタム）
  isBig3: boolean("is_big3").default(false).notNull(), // Big3種目か
  description: text("description"), // 種目の説明（未実装）
  videoUrl: text("video_url"), // デモ動画URL（未実装）
  difficultyLevel: text("difficulty_level"), // 難易度: beginner, intermediate, advanced（未実装）
  equipmentRequired: text("equipment_required").array(), // 必要な器具（配列）（未実装）
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // null=共通マスタ
  createdAt: timestamp("created_at").defaultNow().notNull(), //作成日時
});

// ③ workout_sessions テーブル - トレーニングセッション（1日=1セッション）
export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: text("id")
      .primaryKey() //主キー
      .$defaultFn(() => nanoid(10)), //ランダムな文字列を生成するための関数
    userId: text("user_id") //ユーザーID
      .notNull() //必須
      .references(() => users.id, { onDelete: "cascade" }), //外部キー
    date: date("date").notNull(), // トレーニング日（例: 2025-01-15）
    note: text("note"), // メモ
    durationMinutes: integer("duration_minutes"), // トレーニング時間（分）
    createdAt: timestamp("created_at").defaultNow().notNull(), //作成日時
    updatedAt: timestamp("updated_at") //更新日時
      .defaultNow() //現在日時
      .notNull()
      .$onUpdate(() => new Date()), //更新日時
  },
  // TODO: pgTableの第3引数（extraConfig）が非推奨のため、インデックスをテーブル定義の外に移動する必要がある
  // 修正方法: インデックスを別途定義する（例: export const workoutSessionsUserIdIdx = index(...).on(workoutSessions.userId)）
  (table) => ({
    workoutSessionsUserIdIdx: index("workout_sessions_user_id_idx").on(
      table.userId
    ),
    workoutSessionsDateIdx: index("workout_sessions_date_idx").on(table.date),
  })
);

// ④ sets テーブル - セット記録（1セット=1レコード）
export const sets = pgTable(
  "sets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid(10)),
    sessionId: text("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    setOrder: integer("set_order").notNull(), // セット順（1, 2, 3...）
    weight: numeric("weight", { precision: 6, scale: 1 }).notNull(), // 重量（kg）例: 100.0
    reps: integer("reps").notNull(), // 回数 例: 10
    rpe: numeric("rpe", { precision: 3, scale: 1 }), // 主観的疲労度（RPE: 1-10）例: 8.5
    isWarmup: boolean("is_warmup").default(false).notNull(), // ウォームアップセットか
    restSeconds: integer("rest_seconds"), // セット間の休憩時間（秒）
    notes: text("notes"), // セットごとのメモ
    failure: boolean("failure").default(false), // 限界まで追い込んだか
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  // TODO: pgTableの第3引数（extraConfig）が非推奨のため、インデックスをテーブル定義の外に移動する必要がある
  // 修正方法: インデックスを別途定義する（例: export const setsSessionIdIdx = index(...).on(sets.sessionId)）
  (table) => ({
    setsSessionIdIdx: index("sets_session_id_idx").on(table.sessionId),
    setsExerciseIdIdx: index("sets_exercise_id_idx").on(table.exerciseId),
  })
);

// ⑤ cardio_records テーブル - 有酸素種目の記録
export const cardioRecords = pgTable("cardio_records", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  sessionId: text("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id") //種目ID
    .notNull()
    .references(() => exercises.id, { onDelete: "restrict" }), //外部キー
  duration: integer("duration").notNull(), // 時間（分）
  distance: numeric("distance", { precision: 6, scale: 2 }), // 距離（km）例: 5.50
  speed: numeric("speed", { precision: 5, scale: 2 }), // 速度（km/h）例: 10.50
  calories: integer("calories"), // 消費カロリー（kcal）
  heartRate: integer("heart_rate"), // 心拍数（bpm）
  incline: numeric("incline", { precision: 4, scale: 1 }), // 傾斜（%）例: 5.0
  notes: text("notes"), // メモ
  createdAt: timestamp("created_at").defaultNow().notNull(), //記録日時
});

// ⑥ user_exercise_settings テーブル - ユーザーごとの種目表示設定
export const userExerciseSettings = pgTable(
  "user_exercise_settings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id") //種目ID
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    isVisible: boolean("is_visible").notNull(), // true: リストに表示(initial), false: 隠す(selectable)
    updatedAt: timestamp("updated_at").defaultNow().notNull(), //更新日時
  },
  // TODO: pgTableの第3引数（extraConfig）が非推奨のため、複合主キーをテーブル定義の外に移動する必要がある
  // 修正方法: 複合主キーを別途定義する（例: export const userExerciseSettingsPk = primaryKey({ columns: [userExerciseSettings.userId, userExerciseSettings.exerciseId] })）
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.exerciseId] }), // 複合主キー
  })
);
