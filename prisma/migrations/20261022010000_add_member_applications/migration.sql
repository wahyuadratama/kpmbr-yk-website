-- CreateTable: member_applications (self-service, persetujuan sekretariat/admin)
CREATE TABLE `member_applications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `full_name` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(64) NULL,
    `gender` ENUM('LAKI_LAKI', 'PEREMPUAN') NULL,
    `phone` VARCHAR(32) NULL,
    `address_detail` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `bio` TEXT NULL,
    `rejection_note` VARCHAR(255) NULL,
    `reviewed_by_id` VARCHAR(191) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `member_applications_user_id_status_idx`(`user_id`, `status`),
    INDEX `member_applications_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `member_applications` ADD CONSTRAINT `member_applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_applications` ADD CONSTRAINT `member_applications_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
