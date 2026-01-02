CREATE TABLE IF NOT EXISTS "prompt_favorite" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"prompt_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prompt_favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "prompt_favorite_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompt"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "prompt_favorite_user_prompt_unique" ON "prompt_favorite" ("user_id","prompt_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_favorite_user_id_idx" ON "prompt_favorite" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_favorite_prompt_id_idx" ON "prompt_favorite" ("prompt_id");