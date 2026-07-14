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
    id: text("id") // プロフィールID（文字列・主キー・10文字のNano IDを自動生成）
      .primaryKey()
      .$defaultFn(() => nanoid(10)),
    userId: text("user_id") // プロフィール所有者のユーザーID（文字列・必須・外部キー・重複不可）
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }) // ユーザー削除時にプロフィールも削除
      .unique(), // 1ユーザーにつき1プロフィール
    height: numeric("height", { precision: 5, scale: 2 }), // 身長cm（数値・任意・整数3桁＋小数2桁まで）
    weight: numeric("weight", { precision: 5, scale: 2 }), // 体重kg（数値・任意・整数3桁＋小数2桁まで）
    bodyFat: numeric("body_fat", { precision: 4, scale: 1 }), // 体脂肪率%（数値・任意・整数3桁＋小数1桁まで）
    muscleMass: numeric("muscle_mass", { precision: 5, scale: 2 }), // 筋肉量kg（数値・任意・整数3桁＋小数2桁まで）
    big3TargetBenchPress: numeric("big3_target_bench_press", {
      precision: 6,
      scale: 1,
    }), // ベンチプレス目標重量kg（数値・任意・整数5桁＋小数1桁まで）
    big3TargetSquat: numeric("big3_target_squat", { precision: 6, scale: 1 }), // スクワット目標重量kg（数値・任意・整数5桁＋小数1桁まで）
    big3TargetDeadlift: numeric("big3_target_deadlift", {
      precision: 6,
      scale: 1,
    }), // デッドリフト目標重量kg（数値・任意・整数5桁＋小数1桁まで）
    createdAt: timestamp("created_at").defaultNow().notNull(), // プロフィール作成日時（日時・必須・初期値は現在時刻）
    updatedAt: timestamp("updated_at") // プロフィール更新日時（日時・必須・更新時に自動更新）
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
    id: text("id") // プロフィール履歴ID（文字列・主キー・10文字のNano IDを自動生成）
      .primaryKey()
      .$defaultFn(() => nanoid(10)),
    userId: text("user_id") // 履歴所有者のユーザーID（文字列・必須・外部キー）
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // ユーザー削除時に履歴も削除
    height: numeric("height", { precision: 5, scale: 2 }), // 記録時の身長cm（数値・任意・整数3桁＋小数2桁まで）
    weight: numeric("weight", { precision: 5, scale: 2 }), // 記録時の体重kg（数値・任意・整数3桁＋小数2桁まで）
    bodyFat: numeric("body_fat", { precision: 4, scale: 1 }), // 記録時の体脂肪率%（数値・任意・整数3桁＋小数1桁まで）
    muscleMass: numeric("muscle_mass", { precision: 5, scale: 2 }), // 記録時の筋肉量kg（数値・任意・整数3桁＋小数2桁まで）
    bmi: numeric("bmi", { precision: 4, scale: 1 }), // 記録時のBMI計算値（数値・任意・整数3桁＋小数1桁まで）
    recordedAt: timestamp("recorded_at").defaultNow().notNull(), // 測定記録日時（日時・必須・初期値は現在時刻）
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
  id: text("id") // 種目ID（文字列・主キー・10文字のNano IDを自動生成）
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  name: text("name").notNull(), // 種目名（文字列・必須、例: ベンチプレス）
  nameEn: text("name_en"), // 種目の英語名（文字列・任意、例: Bench Press）
  bodyPart: text("body_part").notNull(), // 対象部位（文字列・必須、例: chest・back・legs）
  muscleSubGroup: text("muscle_sub_group"), // 筋肉の詳細分類（文字列・任意、例: chest_overall）
  targetMuscleGroups: text("target_muscle_groups").array(), // 対象筋一覧（文字列配列・任意）
  primaryEquipment: text("primary_equipment"), // 主に使う器具（文字列・任意、例: barbell・machine）
  tier: text("tier").default("selectable").notNull(), // 表示階層（文字列・必須・初期値selectable）
  isBig3: boolean("is_big3").default(false).notNull(), // Big3種目か（真偽値・必須・初期値false）
  description: text("description"), // 種目説明（文字列・任意・現在未使用）
  videoUrl: text("video_url"), // デモ動画URL（文字列・任意・現在未使用）
  difficultyLevel: text("difficulty_level"), // 難易度（文字列・任意・現在未使用）
  equipmentRequired: text("equipment_required").array(), // 必要器具一覧（文字列配列・任意・現在未使用）
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // 作成者ユーザーID（文字列・任意・外部キー、nullは共通種目）
  createdAt: timestamp("created_at").defaultNow().notNull(), // 種目作成日時（日時・必須・初期値は現在時刻）
});

// ③ workout_sessions テーブル - トレーニングセッション（1日=1セッション）
// userIdを直接持つため、トレーニング記録の所有者判定の起点になる。
export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: text("id") // ワークアウトセッションID（文字列・主キー・10文字のNano IDを自動生成）
      .primaryKey()
      .$defaultFn(() => nanoid(10)),
    userId: text("user_id") // セッションの所有者となるユーザーID（文字列・外部キー）
      .notNull() // 必須
      .references(() => users.id, { onDelete: "cascade" }), // ユーザー削除時にセッションも削除
    date: date("date").notNull(), // トレーニング実施日（年月日・必須、例: 2025-01-15）
    note: text("note"), // セッション全体のメモ（文字列・任意）
    durationMinutes: integer("duration_minutes"), // トレーニング時間（整数・任意・単位は分）
    createdAt: timestamp("created_at").defaultNow().notNull(), // セッション作成日時（日時・必須・初期値は現在時刻）
    updatedAt: timestamp("updated_at") // セッション更新日時（日時・必須・更新時に自動更新）
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
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
// sets自体はuserIdを持たない。所有者確認はsessionIdからworkoutSessionsへたどり、
// workoutSessions.userIdと認証済みuserIdが一致するかで判断する。
export const sets = pgTable(
  "sets",
  {
    id: text("id") // セット記録ID（文字列・主キー・10文字のNano IDを自動生成）
      .primaryKey()
      .$defaultFn(() => nanoid(10)),
    sessionId: text("session_id") // セットが属するワークアウトセッションID（文字列・外部キー）
      .notNull() // 必須
      .references(() => workoutSessions.id, { onDelete: "cascade" }), // セッション削除時にセットも削除
    exerciseId: text("exercise_id") // 実施した種目ID（文字列・必須・外部キー）
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }), // 使用中の種目削除を禁止
    setOrder: integer("set_order").notNull(), // セット順（整数・必須、例: 1・2・3）
    weight: numeric("weight", { precision: 6, scale: 1 }).notNull(), // 使用重量kg（数値・必須・整数5桁＋小数1桁まで）
    reps: integer("reps").notNull(), // 実施回数（整数・必須）
    rpe: numeric("rpe", { precision: 3, scale: 1 }), // 主観的運動強度RPE（数値・任意・整数2桁＋小数1桁まで）
    isWarmup: boolean("is_warmup").default(false).notNull(), // ウォームアップか（真偽値・必須・初期値false）
    restSeconds: integer("rest_seconds"), // セット後の休憩時間（整数・任意・単位は秒）
    notes: text("notes"), // セット単位のメモ（文字列・任意）
    failure: boolean("failure").default(false), // 限界まで実施したか（真偽値・任意・初期値false）
    isPersonalRecord: boolean("is_personal_record").default(false), // 自己ベスト記録か（真偽値・任意・初期値false）
    createdAt: timestamp("created_at").defaultNow().notNull(), // セット記録作成日時（日時・必須・初期値は現在時刻）
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
  id: text("id") // 有酸素記録ID（文字列・主キー・10文字のNano IDを自動生成）
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  sessionId: text("session_id") // 有酸素記録が属するセッションID（文字列・必須・外部キー）
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }), // セッション削除時に有酸素記録も削除
  exerciseId: text("exercise_id") // 実施した有酸素種目ID（文字列・必須・外部キー）
    .notNull()
    .references(() => exercises.id, { onDelete: "restrict" }), // 使用中の種目削除を禁止
  duration: integer("duration").notNull(), // 実施時間（整数・必須・単位は分）
  distance: numeric("distance", { precision: 6, scale: 2 }), // 移動距離km（数値・任意・整数4桁＋小数2桁まで）
  speed: numeric("speed", { precision: 5, scale: 2 }), // 平均速度km/h（数値・任意・整数3桁＋小数2桁まで）
  calories: integer("calories"), // 消費カロリーkcal（整数・任意）
  heartRate: integer("heart_rate"), // 心拍数bpm（整数・任意）
  incline: numeric("incline", { precision: 4, scale: 1 }), // 傾斜率%（数値・任意・整数3桁＋小数1桁まで）
  notes: text("notes"), // 有酸素記録のメモ（文字列・任意）
  createdAt: timestamp("created_at").defaultNow().notNull(), // 有酸素記録作成日時（日時・必須・初期値は現在時刻）
});

// ⑥ user_exercise_settings テーブル - ユーザーごとの種目表示設定
export const userExerciseSettings = pgTable(
  "user_exercise_settings",
  {
    userId: text("user_id") // 表示設定を持つユーザーID（文字列・必須・外部キー・複合主キーの一部）
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // ユーザー削除時に設定も削除
    exerciseId: text("exercise_id") // 表示対象の種目ID（文字列・必須・外部キー・複合主キーの一部）
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }), // 種目削除時に設定も削除
    isVisible: boolean("is_visible").notNull(), // 種目を表示するか（真偽値・必須、trueは表示・falseは非表示）
    updatedAt: timestamp("updated_at").defaultNow().notNull(), // 表示設定更新日時（日時・必須・初期値は現在時刻）
  },
  // TODO: pgTableの第3引数（extraConfig）が非推奨のため、複合主キーをテーブル定義の外に移動する必要がある
  // 修正方法: 複合主キーを別途定義する（例: export const userExerciseSettingsPk = primaryKey({ columns: [userExerciseSettings.userId, userExerciseSettings.exerciseId] })）
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.exerciseId] }), // 複合主キー
  })
);
