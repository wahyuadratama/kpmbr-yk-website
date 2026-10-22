-- Gambar sampul untuk pengumuman
ALTER TABLE `announcements` ADD COLUMN `cover_file_id` VARCHAR(191) NULL;

CREATE INDEX `announcements_cover_file_id_idx` ON `announcements`(`cover_file_id`);

-- AddForeignKey
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_cover_file_id_fkey` FOREIGN KEY (`cover_file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
