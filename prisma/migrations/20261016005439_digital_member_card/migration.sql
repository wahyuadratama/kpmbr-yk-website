-- AlterTable
ALTER TABLE `news` MODIFY `author_name` VARCHAR(191) NOT NULL DEFAULT 'Sekretariat KPMBR-YK';

-- AlterTable
ALTER TABLE `position_assignments` ADD COLUMN `userId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `digital_member_cards` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `public_key` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `revoked_at` DATETIME(3) NULL,
    `revoked_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `digital_member_cards_token_hash_key`(`token_hash`),
    UNIQUE INDEX `digital_member_cards_public_key_key`(`public_key`),
    INDEX `digital_member_cards_member_id_idx`(`member_id`),
    INDEX `digital_member_cards_is_active_idx`(`is_active`),
    INDEX `digital_member_cards_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `digital_member_cards` ADD CONSTRAINT `digital_member_cards_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `digital_member_cards` ADD CONSTRAINT `digital_member_cards_revoked_by_id_fkey` FOREIGN KEY (`revoked_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `position_assignments` ADD CONSTRAINT `position_assignments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
