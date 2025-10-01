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
CREATE INDEX `access_token_created_at_idx` ON `access_tokens` (`created_at`);