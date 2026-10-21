ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_refresh_token_hash_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "serial_diary_entry_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "diary_entry_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "post_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "list_user_id_idx";