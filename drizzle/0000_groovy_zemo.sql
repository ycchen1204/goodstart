CREATE TABLE `activation_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`used_by_user_id` text,
	`used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`used_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_activation_codes_hash` ON `activation_codes` (`code_hash`);--> statement-breakpoint
CREATE INDEX `idx_activation_codes_cohort` ON `activation_codes` (`cohort_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`before_json` text NOT NULL,
	`after_json` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_cohort_time` ON `audit_logs` (`cohort_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `body_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`membership_id` text NOT NULL,
	`measured_at` text NOT NULL,
	`instrument` text NOT NULL,
	`weight_kg` text NOT NULL,
	`bmi` text NOT NULL,
	`waist_cm` text NOT NULL,
	`waist_hip_ratio` text NOT NULL,
	`skeletal_muscle_kg` text NOT NULL,
	`body_fat_kg` text NOT NULL,
	`body_fat_percent` text NOT NULL,
	`override_reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_measurements_member_time` ON `body_measurements` (`membership_id`,`measured_at`);--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `consents` (
	`id` text PRIMARY KEY NOT NULL,
	`membership_id` text NOT NULL,
	`ai_food_image_consent` integer NOT NULL,
	`research_consent` integer NOT NULL,
	`version` text NOT NULL,
	`withdrawn_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_consents_membership` ON `consents` (`membership_id`);--> statement-breakpoint
CREATE TABLE `lifestyle_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`membership_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`sleep_quality` integer NOT NULL,
	`exercise_days` integer NOT NULL,
	`exercise_minutes` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_lifestyle_member_week` ON `lifestyle_reviews` (`membership_id`,`week_number`);--> statement-breakpoint
CREATE TABLE `meal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`membership_id` text NOT NULL,
	`meal_date` text NOT NULL,
	`meal_type` text NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`protein_min_g` integer,
	`protein_max_g` integer,
	`image_object_key` text,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_meals_member_date` ON `meal_records` (`membership_id`,`meal_date`);--> statement-breakpoint
CREATE INDEX `idx_meals_visibility` ON `meal_records` (`visibility`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`user_id` text NOT NULL,
	`leaderboard_opt_in` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_memberships_cohort_user` ON `memberships` (`cohort_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_memberships_cohort` ON `memberships` (`cohort_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`line_subject` text NOT NULL,
	`display_name` text NOT NULL,
	`department` text,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_users_line_subject` ON `users` (`line_subject`);--> statement-breakpoint
CREATE TABLE `weekly_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`membership_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`affirmation` text NOT NULL,
	`priority` text NOT NULL,
	`next_action` text NOT NULL,
	`author_user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_summary_member_week` ON `weekly_summaries` (`membership_id`,`week_number`);