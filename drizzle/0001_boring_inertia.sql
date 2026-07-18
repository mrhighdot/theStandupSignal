CREATE TABLE `work_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`raw_activity_id` int,
	`source` enum('github','discord') NOT NULL,
	`type` enum('assignment','acknowledgement','progress','blocker','review_request','completion') NOT NULL,
	`description` text NOT NULL,
	`task_key` varchar(255),
	`confidence` enum('high','medium','low') NOT NULL,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`occurred_at` datetime NOT NULL,
	`resolved_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `work_signals` ADD CONSTRAINT `work_signals_member_id_team_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_signals` ADD CONSTRAINT `work_signals_raw_activity_id_raw_activity_id_fk` FOREIGN KEY (`raw_activity_id`) REFERENCES `raw_activity`(`id`) ON DELETE no action ON UPDATE no action;