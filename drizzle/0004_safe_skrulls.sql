CREATE TABLE `reviewAuthors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`googleId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`avatarUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviewAuthors_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviewAuthors_googleId_unique` UNIQUE(`googleId`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`travelId` int,
	`rating` int NOT NULL,
	`comment` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewToken` varchar(255),
	`tokenExpiresAt` timestamp,
	`tokenUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_reviewToken_unique` UNIQUE(`reviewToken`)
);
--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_authorId_reviewAuthors_id_fk` FOREIGN KEY (`authorId`) REFERENCES `reviewAuthors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_travelId_travels_id_fk` FOREIGN KEY (`travelId`) REFERENCES `travels`(`id`) ON DELETE set null ON UPDATE no action;