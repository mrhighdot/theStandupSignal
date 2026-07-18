ALTER TABLE `raw_activity` ADD `external_id` varchar(255) NOT NULL;--> statement-breakpoint
CREATE INDEX `raw_activity_source_external_id_idx` ON `raw_activity` (`source`,`external_id`);