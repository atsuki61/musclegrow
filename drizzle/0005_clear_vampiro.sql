CREATE INDEX IF NOT EXISTS "profile_history_user_id_idx" ON "profile_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profile_history_date_idx" ON "profile_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_user_id_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sets_session_id_idx" ON "sets" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sets_exercise_id_idx" ON "sets" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workout_sessions_user_id_idx" ON "workout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workout_sessions_date_idx" ON "workout_sessions" USING btree ("date");