-- Tambah role BENDAHARA
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('ADMIN', 'PENGURUS', 'BENDAHARA', 'ANGGOTA', 'ALUMNI') NOT NULL DEFAULT 'ANGGOTA';

-- Alur kerja laporan keuangan
ALTER TABLE `financial_reports` ADD COLUMN `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT';
ALTER TABLE `financial_reports` ADD COLUMN `submitted_at` DATETIME(3) NULL;
ALTER TABLE `financial_reports` ADD COLUMN `approved_at` DATETIME(3) NULL;
ALTER TABLE `financial_reports` ADD COLUMN `published_at` DATETIME(3) NULL;
ALTER TABLE `financial_reports` ADD COLUMN `rejected_at` DATETIME(3) NULL;
ALTER TABLE `financial_reports` ADD COLUMN `rejection_note` TEXT NULL;

CREATE INDEX `financial_reports_status_idx` ON `financial_reports`(`status`);

-- Riwayat persetujuan laporan keuangan
CREATE TABLE `financial_report_approvals` (
    `id` VARCHAR(191) NOT NULL,
    `report_id` VARCHAR(191) NOT NULL,
    `action` ENUM('SUBMIT', 'APPROVE', 'REJECT', 'PUBLISH') NOT NULL,
    `note` TEXT NULL,
    `actor_id` VARCHAR(191) NULL,

    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `financial_report_approvals_report_id_created_at_idx`(`report_id`, `created_at`),
    INDEX `financial_report_approvals_actor_id_idx`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `financial_report_approvals` ADD CONSTRAINT `financial_report_approvals_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `financial_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_report_approvals` ADD CONSTRAINT `financial_report_approvals_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Pengaturan website & status operasional
CREATE TABLE `website_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `is_maintenance_enabled` BOOLEAN NOT NULL DEFAULT false,
    `maintenance_message` TEXT NULL,
    `maintenance_started_at` DATETIME(3) NULL,
    `maintenance_estimate_at` DATETIME(3) NULL,
    `site_name` VARCHAR(191) NULL,
    `site_description` TEXT NULL,
    `slogan` VARCHAR(191) NULL,
    `organization_name` VARCHAR(191) NULL,
    `contact_email` VARCHAR(191) NULL,
    `contact_instagram` VARCHAR(191) NULL,
    `address_line` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `region` VARCHAR(100) NULL,
    `seo_title` VARCHAR(191) NULL,
    `seo_description` TEXT NULL,
    `navigation_json` LONGTEXT NULL,
    `footer_json` LONGTEXT NULL,
    `updated_by_id` VARCHAR(191) NULL,

    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `website_settings` ADD CONSTRAINT `website_settings_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
