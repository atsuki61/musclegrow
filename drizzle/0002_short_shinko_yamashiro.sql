DO $$ BEGIN
	ALTER TABLE "exercises" ADD COLUMN "muscle_sub_group" text;
EXCEPTION
	WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "exercises" ADD COLUMN "primary_equipment" text;
EXCEPTION
	WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "exercises" ADD COLUMN "tier" text DEFAULT 'selectable' NOT NULL;
EXCEPTION
	WHEN duplicate_column THEN null;
END $$;