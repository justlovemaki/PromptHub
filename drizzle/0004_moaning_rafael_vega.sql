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
ALTER TABLE `user` ADD `subscription_ai_points` integer DEFAULT 0;