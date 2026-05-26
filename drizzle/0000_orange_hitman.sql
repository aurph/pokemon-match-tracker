CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`game_number` integer DEFAULT 1 NOT NULL,
	`played_at` integer NOT NULL,
	`event` text NOT NULL,
	`format` text NOT NULL,
	`opponent_deck` text NOT NULL,
	`opponent_name` text,
	`tournament_id` text,
	`round` integer,
	`coin_flip` text,
	`going` text NOT NULL,
	`my_mulligans` integer DEFAULT 0 NOT NULL,
	`opp_mulligans` integer DEFAULT 0 NOT NULL,
	`hand_quality` integer,
	`prize_trade` text,
	`turn_count` integer,
	`time_used_min` integer,
	`lock_turn` integer,
	`key_cards_drawn` text,
	`tech_cards_used` text,
	`prized_cards` text,
	`result` text NOT NULL,
	`mistakes` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_games_opponent` ON `games` (`opponent_deck`);--> statement-breakpoint
CREATE INDEX `idx_games_played_at` ON `games` (`played_at`);--> statement-breakpoint
CREATE INDEX `idx_games_match` ON `games` (`match_id`);