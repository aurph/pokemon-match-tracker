CREATE TABLE `custom_opponent_decks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_opponent_decks_name_unique` ON `custom_opponent_decks` (`name`);--> statement-breakpoint
CREATE TABLE `deck_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`name` text NOT NULL,
	`set_code` text NOT NULL,
	`set_number` text NOT NULL,
	`category` text NOT NULL,
	`role` text,
	`notes` text,
	`image_url` text,
	`image_local_path` text,
	`order_index` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_deck_cards_order` ON `deck_cards` (`order_index`);--> statement-breakpoint
CREATE TABLE `iterations` (
	`id` text PRIMARY KEY NOT NULL,
	`dated` integer NOT NULL,
	`version` text NOT NULL,
	`cards_in` text,
	`cards_out` text,
	`reasoning` text,
	`tested_vs` text,
	`verdict` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`event` text NOT NULL,
	`dated` integer NOT NULL,
	`format` text,
	`size` integer,
	`rounds_total` integer,
	`final_record` text,
	`placement` integer,
	`made_cut` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wishlist` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`name` text NOT NULL,
	`set_code` text NOT NULL,
	`set_number` text NOT NULL,
	`category` text NOT NULL,
	`role` text,
	`notes` text,
	`image_url` text,
	`image_local_path` text,
	`order_index` integer NOT NULL,
	`priority` text,
	`replaces` text,
	`reason` text
);
