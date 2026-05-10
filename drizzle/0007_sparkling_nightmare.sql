ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "target_muscle_groups" text[];--> statement-breakpoint
ALTER TABLE "sets" ADD COLUMN IF NOT EXISTS "is_personal_record" boolean DEFAULT false;
