ALTER TABLE "exercises" ADD COLUMN "muscle_sub_group" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "primary_equipment" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "tier" text DEFAULT 'selectable' NOT NULL;