-- CreateTable
CREATE TABLE `financial_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,

    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `financial_categories_slug_key`(`slug`),
    INDEX `financial_categories_type_idx`(`type`),
    INDEX `financial_categories_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `amount` BIGINT NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(255) NULL,
    `proof_file_id` VARCHAR(191) NULL,
    `created_by_id` VARCHAR(191) NULL,

    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `financial_transactions_date_type_idx`(`date`, `type`),
    INDEX `financial_transactions_category_id_idx`(`category_id`),
    INDEX `financial_transactions_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_reports` (
    `id` VARCHAR(191) NOT NULL,
    `period_year` INTEGER NOT NULL,
    `period_month` SMALLINT NULL,
    `period_type` ENUM('MONTHLY', 'YEARLY') NOT NULL,
    `income_total` BIGINT NOT NULL DEFAULT 0,
    `expense_total` BIGINT NOT NULL DEFAULT 0,
    `balance` BIGINT NOT NULL DEFAULT 0,
    `visibility` ENUM('PUBLIC', 'MEMBER_ONLY', 'PENGURUS_ONLY', 'ADMIN_ONLY') NOT NULL DEFAULT 'MEMBER_ONLY',
    `document_file_id` VARCHAR(191) NULL,
    `created_by_id` VARCHAR(191) NULL,

    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `financial_reports_period_year_period_month_idx`(`period_year`, `period_month`),
    INDEX `financial_reports_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `financial_transactions` ADD CONSTRAINT `financial_transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `financial_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_transactions` ADD CONSTRAINT `financial_transactions_proof_file_id_fkey` FOREIGN KEY (`proof_file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_transactions` ADD CONSTRAINT `financial_transactions_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_reports` ADD CONSTRAINT `financial_reports_document_file_id_fkey` FOREIGN KEY (`document_file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_reports` ADD CONSTRAINT `financial_reports_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
