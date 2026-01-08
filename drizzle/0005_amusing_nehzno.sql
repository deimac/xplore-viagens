ALTER TABLE `reviews` DROP INDEX `reviews_reviewToken_unique`;--> statement-breakpoint
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_travelId_travels_id_fk`;
--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `travelId`;--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `reviewToken`;--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `tokenExpiresAt`;--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `tokenUsedAt`;