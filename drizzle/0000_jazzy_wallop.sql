CREATE TABLE `blockers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`description` text NOT NULL,
	`normalized_key` varchar(255) NOT NULL,
	`first_seen_date` varchar(10) NOT NULL,
	`last_seen_date` varchar(10) NOT NULL,
	`still_open` boolean NOT NULL DEFAULT true,
	`repeat_count` int NOT NULL DEFAULT 1,
	CONSTRAINT `blockers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `digests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`digest_date` varchar(10) NOT NULL,
	`payload_json` text NOT NULL,
	`published_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `digests_id` PRIMARY KEY(`id`),
	CONSTRAINT `digests_digest_date_unique` UNIQUE(`digest_date`)
);
--> statement-breakpoint
CREATE TABLE `raw_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`source` enum('github','discord') NOT NULL,
	`type` enum('commit','pr_open','pr_merge','review_comment','chat_message') NOT NULL,
	`content` text NOT NULL,
	`occurred_at` datetime NOT NULL,
	`synced_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `raw_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`github_handle` varchar(100),
	`discord_handle` varchar(100),
	`display_name` varchar(160) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `blockers` ADD CONSTRAINT `blockers_member_id_team_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raw_activity` ADD CONSTRAINT `raw_activity_member_id_team_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;