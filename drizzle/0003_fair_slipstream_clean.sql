-- マイグレーション: profile_historyテーブルの作成
-- 実行方法: SupabaseダッシュボードのSQL Editorでこのファイルの内容をコピー&ペーストして実行してください

-- profile_historyテーブルの作成
CREATE TABLE IF NOT EXISTS "profile_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"height" numeric(5, 2),
	"weight" numeric(5, 2),
	"body_fat" numeric(4, 1),
	"muscle_mass" numeric(5, 2),
	"bmi" numeric(4, 1),
	"recorded_at" timestamp DEFAULT now() NOT NULL
);

-- 外部キー制約の追加
ALTER TABLE "profile_history" 
ADD CONSTRAINT "profile_history_user_id_users_id_fk" 
FOREIGN KEY ("user_id") 
REFERENCES "public"."users"("id") 
ON DELETE cascade 
ON UPDATE no action;

-- インデックスの追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS "profile_history_user_id_idx" ON "profile_history"("user_id");
CREATE INDEX IF NOT EXISTS "profile_history_recorded_at_idx" ON "profile_history"("recorded_at");

