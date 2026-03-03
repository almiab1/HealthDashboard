CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(50) NOT NULL,
	`value` varchar(255) NOT NULL,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `body_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int DEFAULT 1,
	`recorded_at` date NOT NULL,
	`weight` decimal(5,2) NOT NULL,
	`bmi` decimal(4,1),
	`fat_mass_kg` decimal(5,2),
	`fat_mass_percent` decimal(4,1),
	`muscle_mass_kg` decimal(5,2),
	`free_mass_kg` decimal(5,2),
	`water_kg` decimal(5,2),
	`water_percent` decimal(4,1),
	`bone_mass_kg` decimal(4,2),
	`visceral_fat` decimal(4,1),
	`bmr` decimal(6,2),
	`metabolic_age` tinyint,
	`phase_angle` decimal(4,2),
	`resistance` decimal(6,2),
	`reactance` decimal(6,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `body_metrics_id` PRIMARY KEY(`id`)
);
