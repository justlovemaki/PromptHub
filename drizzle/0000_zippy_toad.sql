CREATE TABLE `access_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `access_token_idx` ON `access_tokens` (`access_token`);--> statement-breakpoint
CREATE INDEX `access_token_user_id_idx` ON `access_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `access_token_created_at_idx` ON `access_tokens` (`created_at`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_point_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`balance` integer NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`related_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ai_point_transaction_user_id_idx` ON `ai_point_transaction` (`user_id`);--> statement-breakpoint
CREATE TABLE `membership` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'MEMBER' NOT NULL,
	`user_id` text NOT NULL,
	`space_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`space_id`) REFERENCES `space`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `membership_user_space_unique` ON `membership` (`user_id`,`space_id`);--> statement-breakpoint
CREATE TABLE `prompt` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '',
	`tags` text DEFAULT '',
	`image_urls` text DEFAULT '[]',
	`author` text DEFAULT '',
	`is_public` integer DEFAULT false,
	`is_approved` integer DEFAULT false,
	`use_count` integer DEFAULT 0,
	`space_id` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `space`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prompt_space_id_idx` ON `prompt` (`space_id`);--> statement-breakpoint
CREATE INDEX `prompt_created_by_idx` ON `prompt` (`created_by`);--> statement-breakpoint
CREATE INDEX `prompt_is_approved_idx` ON `prompt` (`is_approved`);--> statement-breakpoint
CREATE TABLE `prompt_favorite` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompt`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_favorite_user_prompt_unique` ON `prompt_favorite` (`user_id`,`prompt_id`);--> statement-breakpoint
CREATE INDEX `prompt_favorite_user_id_idx` ON `prompt_favorite` (`user_id`);--> statement-breakpoint
CREATE INDEX `prompt_favorite_prompt_id_idx` ON `prompt_favorite` (`prompt_id`);--> statement-breakpoint
CREATE TABLE `prompt_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`used_at` integer NOT NULL,
	`metadata` text,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompt`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prompt_usage_prompt_id_idx` ON `prompt_usage` (`prompt_id`);--> statement-breakpoint
CREATE INDEX `prompt_usage_user_id_idx` ON `prompt_usage` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `space` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`owner_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `system_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`category` text NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`user_id` text,
	`user_email` text,
	`ip` text,
	`user_agent` text,
	`timestamp` integer NOT NULL,
	`status_code` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `system_logs_timestamp_idx` ON `system_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `system_logs_level_idx` ON `system_logs` (`level`);--> statement-breakpoint
CREATE INDEX `system_logs_category_idx` ON `system_logs` (`category`);--> statement-breakpoint
CREATE INDEX `system_logs_user_id_idx` ON `system_logs` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`username` text,
	`display_username` text,
	`role` text DEFAULT 'USER' NOT NULL,
	`subscription_status` text DEFAULT 'FREE' NOT NULL,
	`stripe_customer_id` text,
	`subscription_id` text,
	`subscription_end_date` integer,
	`subscription_ai_points` integer DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
