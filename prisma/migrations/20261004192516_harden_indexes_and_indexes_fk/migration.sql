-- =============================================================================
-- Hardening skema: index FK yang hilang, konsistensi kolom, dan penghapusan
-- jalur relasi ganda ke user.
--
-- Disusun manual (bukan hasil `migrate dev` mentah) karena dua hal:
--   1. `files.updated_at` ditambahkan sebagai NOT NULL. MySQL menolak
--      penambahan kolom NOT NULL tanpa default bila tabel sudah berisi baris,
--      jadi kolom dibuat dengan default lalu default-nya dilepas.
--   2. Kolom `position_assignments.user_id` dihapus. Prisma tidak Always
--      menghasilkan DROP COLUMN untuk kolom yang tidak pernah dipakai kode,
--      padahal kolom itu tetap ada di database.
--
-- Alur perubahan schema (wajib):
--   Ubah prisma/schema.prisma → npx prisma migrate dev → MySQL
-- =============================================================================

-- AlterTable
-- `files` sebelumnya tidak punya `updated_at`; semua metadata file kini
-- tercatat kapan diubah (mis. saat access_level diturunkan).
ALTER TABLE `files` ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `files` MODIFY COLUMN `updated_at` DATETIME(3) NOT NULL;

-- CreateIndex
-- Pembersihan sesi kedaluwarsa berjalan berkala; tanpa index ini setiap
-- `DELETE ... WHERE expires < NOW()` memindai seluruh tabel `sessions`.
CREATE INDEX `sessions_expires_idx` ON `sessions`(`expires`);

-- Index FK yang tadinya hanya ada sebagai index implisit dari MySQL
-- (dibuat otomatis saat ADD CONSTRAINT). Sekarang dinyatakan eksplisit di
-- schema.prisma supaya ikut terdeteksi `migrate dev` dan bisa dipakai query.
ALTER TABLE `files` RENAME INDEX `files_uploaded_by_id_fkey` TO `files_uploaded_by_id_idx`;
ALTER TABLE `members` RENAME INDEX `members_avatar_file_id_fkey` TO `members_avatar_file_id_idx`;
ALTER TABLE `news` RENAME INDEX `news_author_id_fkey` TO `news_author_id_idx`;
ALTER TABLE `programs` RENAME INDEX `programs_pic_member_id_fkey` TO `programs_pic_member_id_idx`;

-- DropForeignKey
-- Jalur relasi ke user lewat `position_assignments` dihapus. Keanggotaan
-- selalu diturunkan `member -> user`; dua jalur hanya berisiko tidak sinkron
-- ketika akun-user yang sama diubah dari dua tempat berbeda.
-- Nama constraint pada instalasi lama memakai camelCase karena kolomnya
-- belum pernah di-mapping ke snake_case.
ALTER TABLE `position_assignments` DROP FOREIGN KEY `position_assignments_userId_fkey`;

-- DropIndex
DROP INDEX `position_assignments_userId_fkey` ON `position_assignments`;

-- DropColumn
ALTER TABLE `position_assignments` DROP COLUMN `userId`;