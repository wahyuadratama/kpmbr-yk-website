-- CreateTable
CREATE TABLE `organization_documents` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` ENUM('LPJ', 'PROPOSAL', 'SK', 'NOTULEN', 'AD_ART', 'LAINNYA') NOT NULL,
    `description` TEXT NULL,
    `file_id` VARCHAR(191) NOT NULL,
    `access_level` ENUM('PUBLIC', 'MEMBER_ONLY', 'PENGURUS_ONLY', 'ADMIN_ONLY') NOT NULL DEFAULT 'MEMBER_ONLY',
    `uploaded_by_id` VARCHAR(191) NULL,

    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `organization_documents_slug_key`(`slug`),
    INDEX `organization_documents_category_idx`(`category`),
    INDEX `organization_documents_access_level_idx`(`access_level`),
    INDEX `organization_documents_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `organization_documents` ADD CONSTRAINT `organization_documents_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_documents` ADD CONSTRAINT `organization_documents_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
