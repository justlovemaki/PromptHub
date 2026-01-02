CREATE TYPE "public"."log_category" AS ENUM('AUTH', 'API', 'USER', 'SYSTEM', 'SECURITY', 'PERFORMANCE');--> statement-breakpoint
CREATE TYPE "public"."log_level" AS ENUM('INFO', 'WARN', 'ERROR', 'DEBUG');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."space_type" AS ENUM('PERSONAL', 'TEAM');--> statement-breakpoint
CREATE TABLE "access_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_point_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"balance" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"related_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "membership_role" DEFAULT 'MEMBER' NOT NULL,
	"user_id" text NOT NULL,
	"space_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '',
	"tags" text DEFAULT '[]',
	"image_urls" text DEFAULT '[]',
	"author" text DEFAULT '',
	"is_public" boolean DEFAULT false,
	"use_count" integer DEFAULT 0,
	"space_id" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_favorite" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"prompt_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"prompt_id" text NOT NULL,
	"user_id" text NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "space_type" NOT NULL,
	"owner_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"level" "log_level" NOT NULL,
	"category" "log_category" NOT NULL,
	"message" text NOT NULL,
	"details" text,
	"user_id" text,
	"user_email" text,
	"ip" text,
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"status_code" integer
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text,
	"display_username" text,
	"role" text DEFAULT 'USER',
	"subscription_status" text DEFAULT 'FREE',
	"stripe_customer_id" text,
	"subscription_id" text,
	"subscription_end_date" timestamp with time zone,
	"subscription_ai_points" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_point_transaction" ADD CONSTRAINT "ai_point_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt" ADD CONSTRAINT "prompt_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt" ADD CONSTRAINT "prompt_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_favorite" ADD CONSTRAINT "prompt_favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_favorite" ADD CONSTRAINT "prompt_favorite_prompt_id_prompt_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_usage" ADD CONSTRAINT "prompt_usage_prompt_id_prompt_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_usage" ADD CONSTRAINT "prompt_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space" ADD CONSTRAINT "space_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_token_idx" ON "access_tokens" USING btree ("access_token");--> statement-breakpoint
CREATE INDEX "access_token_user_id_idx" ON "access_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "access_token_created_at_idx" ON "access_tokens" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_point_transaction_user_id_idx" ON "ai_point_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_user_space_unique" ON "membership" USING btree ("user_id","space_id");--> statement-breakpoint
CREATE INDEX "prompt_space_id_idx" ON "prompt" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "prompt_created_by_idx" ON "prompt" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_favorite_user_prompt_unique" ON "prompt_favorite" USING btree ("user_id","prompt_id");--> statement-breakpoint
CREATE INDEX "prompt_favorite_user_id_idx" ON "prompt_favorite" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prompt_favorite_prompt_id_idx" ON "prompt_favorite" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "prompt_usage_prompt_id_idx" ON "prompt_usage" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "prompt_usage_user_id_idx" ON "prompt_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "system_logs_timestamp_idx" ON "system_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "system_logs_level_idx" ON "system_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "system_logs_category_idx" ON "system_logs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "system_logs_user_id_idx" ON "system_logs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_unique" ON "user" USING btree ("username");