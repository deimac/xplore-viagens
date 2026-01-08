CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`cnpj` varchar(20),
	`foundedDate` varchar(50),
	`email` varchar(320),
	`phone` varchar(50),
	`whatsapp` varchar(50),
	`instagram` varchar(255),
	`facebook` varchar(255),
	`linkedin` varchar(255),
	`twitter` varchar(255),
	`quotationLink` text,
	`googleAnalyticsId` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companySettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `heroSlides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageUrl` text NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` text,
	`order` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `heroSlides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`destination` varchar(255) NOT NULL,
	`departureDate` varchar(50),
	`returnDate` varchar(50),
	`travelers` int NOT NULL,
	`budget` varchar(100),
	`message` text,
	`status` enum('pending','contacted','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `travelCategories` (
	`travelId` int NOT NULL,
	`categoryId` int NOT NULL,
	CONSTRAINT `travelCategories_travelId_categoryId_pk` PRIMARY KEY(`travelId`,`categoryId`)
);
--> statement-breakpoint
CREATE TABLE `travels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`origin` varchar(255) NOT NULL,
	`departureDate` varchar(50),
	`returnDate` varchar(50),
	`travelers` varchar(100),
	`price` varchar(100) NOT NULL,
	`imageUrl` text,
	`promotion` varchar(30),
	`promotionColor` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `travels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `bookings`;--> statement-breakpoint
DROP TABLE `destinations`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `travelCategories` ADD CONSTRAINT `travelCategories_travelId_travels_id_fk` FOREIGN KEY (`travelId`) REFERENCES `travels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `travelCategories` ADD CONSTRAINT `travelCategories_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;