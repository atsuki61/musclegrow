CREATE TABLE IF NOT EXISTS "cardio_records" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"duration" integer NOT NULL,
	"distance" numeric(6, 2),
	"speed" numeric(5, 2),
	"calories" integer,
	"heart_rate" integer,
	"incline" numeric(4, 1),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "cardio_records" ADD CONSTRAINT "cardio_records_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "cardio_records" ADD CONSTRAINT "cardio_records_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "profile_history" ADD CONSTRAINT "profile_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;