import {
  pgTable,
  text,
  numeric,
  timestamp,
  date,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { users } from "./auth";

// ① profiles テーブル - ユーザーのプロフィール情報
export const profiles = pgTable("profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  height: numeric("height", { precision: 5, scale: 2 }), // 身長（cm）例: 175.50
  weight: numeric("weight", { precision: 5, scale: 2 }), // 体重（kg）例: 70.50
  bodyFat: numeric("body_fat", { precision: 4, scale: 1 }), // 体脂肪率（%）例: 15.5
  muscleMass: numeric("muscle_mass", { precision: 5, scale: 2 }), // 筋肉量（kg）例: 35.20
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ② exercises テーブル - 種目マスタ（共通マスタ + ユーザー独自種目）
export const exercises = pgTable("exercises", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  name: text("name").notNull(), // 種目名（例: "ベンチプレス"）
  nameEn: text("name_en"), // 英語名（例: "Bench Press"）
  bodyPart: text("body_part").notNull(), // 部位: chest, back, legs, shoulders, arms, core
  isBig3: boolean("is_big3").default(false).notNull(), // Big3種目か
  description: text("description"), // 種目の説明
  videoUrl: text("video_url"), // デモ動画URL
  difficultyLevel: text("difficulty_level"), // 難易度: beginner, intermediate, advanced
  equipmentRequired: text("equipment_required").array(), // 必要な器具（配列）
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // null=共通マスタ
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ③ workout_sessions テーブル - トレーニングセッション（1日=1セッション）
export const workoutSessions = pgTable("workout_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(), // トレーニング日（例: 2025-01-15）
  note: text("note"), // メモ（例: "今日は胸の日"）
  durationMinutes: integer("duration_minutes"), // トレーニング時間（分）
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ④ sets テーブル - セット記録（1セット=1レコード）
export const sets = pgTable("sets", {
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
});



