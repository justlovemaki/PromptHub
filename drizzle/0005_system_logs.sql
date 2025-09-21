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
CREATE INDEX `system_logs_user_id_idx` ON `system_logs` (`user_id`);