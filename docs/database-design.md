# Database Design — KPMBR-YK

MySQL 8.0.30, Prisma 7.10.0. Sumber kebenaran struktur: `prisma/schema.prisma`.
phpMyAdmin hanya untuk melihat, memeriksa, dan men-debug data.

## 1. Alur Kerja Wajib

```text
Ubah prisma/schema.prisma
        ↓
npx prisma migrate dev --name <nama>
        ↓
MySQL kpmbr_db (dibuat/ubah otomatis)
        ↑
phpMyAdmin (hanya untuk melihat & debug)
```

Tidak pernah membuat atau mengubah tabel lewat phpMyAdmin. Kalau struktur
berubah, selalu lewat migration. `prisma/migrations/*.sql` **wajib**
di-commit karena berisi riwayat database.

## 2. Konvensi

| Aspek                 | Keputusan                                                        |
| --------------------- | ---------------------------------------------------------------- |
| Primary key           | `id String @default(cuid())` — UUID non-berurutan, aman bila URL bocor |
| Tabel                 | `snake_case` jamak (`audit_logs`, `organization_positions`)      |
| Kolom                 | `snake_case` (`full_name`, `created_at`)                          |
| Relasi                | `camelCase` di Prisma, di-map ke `snake_case` di DB               |
| Foreign key hapus     | `Cascade` untuk data turunan; `SetNull` untuk histori/audit      |
| Soft delete           | Kolom `deletedAt DateTime?` pada entitas bernilai historis        |
| Waktu                 | `createdAt`, `updatedAt` (default `now()` / `@updatedAt`)         |
| Enum                  | MySQL native ENUM lewat Prisma enum — nilai tertutup & tervalidasi |
| Teks panjang           | `@db.Text` (64 KB) atau `@db.LongText` (4 GB)                    |
| String                | `@db.VarChar(n)` + index untuk yang searched                     |
| Char index            | `VARCHAR(191)` agar aman untuk index utf8mb4 (767 byte / 4)      |
| Charset               | `utf8mb4` / `utf8mb4_unicode_ci`                                  |
| Uang                  | `BigInt` rupiah penuh (tanpa sen). Hindari `Float`                |
| Metadata audit        | `Json?`                                                           |

### Kenapa `cuid()` dan bukan auto-increment?

- URL tetap tidak menebak urutan data.
- Tidak membocorkan jumlah baris.
- Aman digabung antar environment (dev tidak bentrok dengan data impor).

## 3. Entitas Tahap 1 — IMPLEMENTED

Migration: `20261004114408_init`. 12 tabel.

### 3.1 Tabel

| Tabel                     | Isi                                                    |
| ------------------------- | ------------------------------------------------------ |
| `users`                   | Identitas login: email, passwordHash, role, status, lockout |
| `accounts`                | Auth.js — akun OAuth tertaut (disiapkan, belum dipakai)  |
| `sessions`                | Auth.js — sesi database (bukan JWT)                     |
| `verification_tokens`     | Auth.js — verifikasi email / reset password             |
| `members`                 | Profil anggota: nama, angkatan, kampus, prodi, kontak   |
| `memberships`             | Riwayat keanggotaan per periode                         |
| `organization_terms`      | Periode kepengurusan                                    |
| `organization_positions`  | Struktur jabatan (hierarki)                             |
| `position_assignments`    | Siapa memegang jabatan, kapan                            |
| `organization_contents`   | CMS sederhana: sejarah, visi, misi, nilai, identitas    |
| `files`                   | Metadata file (binary di R2)                            |
| `audit_logs`              | Jejak audit append-only                                  |

### 3.2 Relasi & Kardinalitas

```text
User 1 ─── 0..1 Member
User 1 ─── *   Session
User 1 ─── *   Account
User 1 ─── *   AuditLog          (actor opsional)
User 1 ─── *   File              (uploader opsional)
User 1 ─── *   PositionAssignment

Member 1 ─── *   Membership       (riwayat, bukan status tunggal)
Member 1 ─── *   PositionAssignment
Member * ─── 0..1 File           (avatar, relasi 1:1)

OrganizationTerm 1 ─── *   PositionAssignment
OrganizationPosition 1 ─── *   PositionAssignment
OrganizationPosition * ─── 0..1 OrganizationPosition   (parent → children)
OrganizationContent * ─── 0..1 User                   (editor)
File * ─── 0..1 Member                                 (avatar)
```

### 3.3 Keputusan Desain Penting

**a. `User` dipisah dari `Member`.**
Tabel `users` hanya berisi kredensial. Data biografis ada di `members`.
Tabel kredensial jadi sempit dan lebih jarang diekspor. `Member.userId`
nullable, jadi akun admin tanpa keanggotaan tetap bisa ada.

**b. `Membership` terpisah dari `Member`.**
`members` tidak punya kolom `status`. Status keanggotaan ada di
`memberships`. Ini yang membuat transisi berikut berjalan tanpa kehilangan
data:

```text
ANGGOTA → LULUS → ALUMNI
```

Setiap transisi = baris `memberships` baru atau perubahan status +
`end_date` + `end_reason`. Riwayat tidak pernah dihapus.

**c. `memberCode` terpisah dari `id`.**
`id` adalah cuid (teknis). `member_code` adalah nomor anggota yang
dipakai manusia dan dicetak di kartu digital, mis. `KPMBR-YK-2021-0001`.
Format nomor anggota bisa diubah tanpa mengubah primary key.

**d. `OrganizationPosition` dipisah dari `PositionAssignment`.**
Jabatan ( Ketua, Bendahara) terpisah dari orang yang memegang. Satu baris
`organization_positions` dapat dipakai lintas periode. Riwayat siapa
memegang kapan tersimpan di `position_assignments`.

**e. File = metadata saja.**
Tidak ada `LONGBLOB`. Yang disimpan: `storage_key`, `file_name`,
`mime_type`, `size`, `kind`, `access_level`, `alt_text`, `uploaded_by_id`.
Binary ada di Cloudflare R2.

**f. Audit log append-only.**
Tidak ada `updatedAt`/`deletedAt` — sengaja. `actor_id` nullable karena
aksinya bisa dari sistem atau akun yang sudah dihapus. `action` berupa enum
tertutup. `metadata` JSON tidak boleh memuat password atau token.

**g. Soft delete selektif.**
Ada `deletedAt`: `users`, `members`, `files`, dan (rencana) konten.
Tidak ada pada `audit_logs` dan `memberships` — keduanya adalah catatan
historis yang tidak boleh hilang.

### 3.4 Index

| Tabel                | Index                                                        |
| -------------------- | ------------------------------------------------------------ |
| `users`              | `role+status`, `deletedAt`, `email` (unique)                 |
| `members`            | `deletedAt`, `angkatan+graduation_year`, `university`, `is_directory_visible`, `member_code` (unique) |
| `memberships`        | `member_id+cohort` (unique), `status`, `cohort`              |
| `organization_positions` | `level+sort_order`, `parent_id`                           |
| `position_assignments`  | `position_id+is_current`, `member_id`, `term_id`           |
| `files`              | `kind+access_level`, `deletedAt`, `storage_key` (unique)     |
| `audit_logs`         | `actor_id+created_at`, `resource+resource_id`, `action+created_at` |

Rasio tabel `audit_logs` adalah yang paling cepat tumbuh. Partisi per bulan
pertimbangkan saat data sudah nyata (lihat `development-roadmap.md`).

## 4. Entitas Konten Publik — IMPLEMENTED

Rancangan awal di § 4.1 — 4.5. Migration:
`20261004132535_add_public_content`. Tabel yang dibuat: `news_categories`,
`news`, `events`, `programs`, `program_updates`, `documentation_albums`,
`documentation_items`, `announcements`.

Perubahan dari rancangan awal, beserta alasannya:

**a. `news.author_id` nullable + ada `author_name`.**
Rancangan awal hanya `authorId FK → users.id RESTRICT`. Itu membuat berita
tergantung pada akun yang sudah ada. Karena itu `authorId` nullable dengan
`onDelete: SetNull`, dan ditambahkan `authorName` untuk nama penulis yang
tampil di halaman publik ("Sekretariat KPMBR-YK"). Akun pengedit boleh kosong
sampai autentikasi tersedia di tahap 2.

**b. `news.cover_accent` menggantikan `coverGradient` teks bebas.**
Kelas Tailwind tidak disimpan di database. Yang disimpan hanya token
(`brand`, `terra`, `info`, `success`, `brandInfo`, `terraInfo`) yang dipetakan
ke kelas gradient di `src/modules/news/queries.ts`. Gaya tampilan tetap
di satu tempat.

**c. `events` tidak punya RSVP/pendaftaran.** Tetap sesuai rancangan.

**d. `programs.division_name` berupa teks, bukan foreign key.**
Divisi adalah label organisasi, bukan entitas yang perlu di-query terpisah.
Daftar divisi untuk halaman publik diambil dari `organization_contents` dengan
key `struktur.divisi`, dengan fallback ke `division_name` yang unik.

**e. `documentation_albums.photo_count` adalah cache.**
Sumber kebenaran jumlah foto tetap `documentation_items`; `photoCount`
disimpan agar halaman daftar album tidak perlu `COUNT` per baris. Hal ini
dinyatakan pada komentar kolom di `prisma/schema.prisma`.

**f. `documentation_items.file_id` memakai `RESTRICT`.**
Album tidak boleh menunjuk metadata file yang sudah hilang.

**g. `body` disimpan sebagai Markdown polos, bukan HTML.**
Paragraf dipisahkan baris kosong, baris `- ` adalah butir daftar, butir
`**Judul** — keterangan` dipecah menjadi pasangan judul/keterangan. Parser
ada di `src/lib/content/markdown.ts`. Tidak ada HTML mentah, sehingga tidak
ada permukaan XSS dari konten pengguna.

**h. `documentation_items` dan `announcements` sudah ada, belum terpakai.**
Tabelnya disiapkan agar migration tahap berikutnya tidak mengubah skema.
Halaman publik belum menampilkan foto maupun pengumuman; `documentation_items`
menunggu R2 dan `announcements` menunggu dashboard.

### 4.1 Berita — IMPLEMENTED

```text
news_categories   id, slug (unique), name, description, sortOrder
news              id, slug (unique), title, excerpt, body (Markdown),
                  coverAccent, coverFileId (SET NULL), authorName, authorId (SET NULL),
                  categoryId (SET NULL), status (DRAFT/PUBLISHED/ARCHIVED),
                  isFeatured, publishedAt, viewCount, deletedAt
```

Index: `status+published_at`, `category_id+published_at`, unique `slug`.

### 4.2 Program Kerja — IMPLEMENTED

```text
programs          id, slug (unique), name, description, objective,
                  divisionName, picMemberId (SET NULL),
                  status (DRAFT/DIRANCANG/BERJALAN/SELESAI/DIBATALKAN),
                  progress (0..100), startDate, endDate, coverFileId, deletedAt

program_updates   id, programId (CASCADE), progress, note, createdById (SET NULL)
```

Progress 0/25/50/75/100 ditegakkan di service layer
(`toProgramProgress` di `src/modules/programs/queries.ts`), bukan CHECK
constraint, agar pesan error lebih ramah. `program_updates` menyimpan riwayat
progres dan sudah ditampilkan di halaman detail program.

### 4.3 Agenda — IMPLEMENTED

```text
events            id, slug (unique), title, description, startsAt, endsAt,
                  location, organizer,
                  status (DRAFT/TERJADWAL/BERLANGSUNG/SELESAI/DIBATALKAN),
                  coverFileId, deletedAt
```

Index: `starts_at+status`. `DRAFT` tidak pernah keluar ke publik.

### 4.4 Dokumentasi — IMPLEMENTED

```text
documentation_albums  id, slug (unique), title, description, eventDate,
                      accent, coverFileId, photoCount, deletedAt
documentation_items   id, albumId (CASCADE), fileId (RESTRICT),
                      caption, sortOrder
```

### 4.5 Pengumuman — IMPLEMENTED (belum dipakai halaman publik)

```text
announcements     id, title, body, priority (NORMAL/PENTING/MENDESAK),
                  audience (PUBLIC/ANGGOTA/ALUMNI/PENGURUS),
                  publishedAt, expiresAt, createdById (SET NULL), deletedAt
```

`audience` menentukan siapa bisa membaca. Penegakan di server saat query.
Query `getPublicAnnouncements()` sudah tersedia di
`src/modules/organization/queries.ts` tetapi belum dirender.

### 4.6 Keuangan — PLANNED

```text
financial_categories
  id, name, type (enum INCOME, EXPENSE), slug (unique)

financial_transactions
  id, date, amount BigInt, type (enum INCOME, EXPENSE)
  categoryId   FK → financial_categories.id
  description  varchar(255)
  proofFileId  FK → files.id  SET NULL
  createdById, createdAt
  deletedAt
```

Nilai uang memakai `BigInt` rupiah penuh, bukan `Float` dan bukan sen.
Konversi ke string rupiah dilakukan di satu helper (`formatRupiah`).
BigInt tidak bisa `JSON.stringify` langsung — semua jalur serialisasi
harus mem-stringify-kan nilai uang lebih dulu.

```text
financial_reports
  id, periodYear, periodMonth (nullable → laporan tahunan), periodType
  incomeTotal BigInt, expenseTotal BigInt, balance BigInt
  visibility  enum(PUBLIC, MEMBER_ONLY, PENGURUS_ONLY, ADMIN_ONLY)
  documentFileId FK → files.id SET NULL
```

`visibility` mengimplementasikan aturan §23 — anggota hanya melihat
laporan yang memang ditujukan untuk anggota.

### 4.7 Kartu Anggota Digital

```text
digital_member_cards
  id, memberId (FK CASCADE, UNIQUE)
  cardNumber   varchar(32)   UNIQUE
  tokenHash    char(64)     UNIQUE   ← SHA-256 dari token acak
  issuedAt, expiresAt?, revokedAt?
```

**Token tidak pernah disimpan dalam bentuk plaintext.** Yang disimpan hanya
`tokenHash`. Verifikasi: hash token dari URL, bandingkan dengan hash di
database. Isi QR hanya opaque identifier, bukan data pribadi.

Route `/member-card/verify/[token]` mengembalikan status validity saja
(aktif/expired/revoked), bukan data anggota lengkap, untuk role non-ADMIN.

### 4.8 Arsip Dokumen

```text
organization_documents
  id, title, description
  category  enum(AD_ART, LPJ, PROPOSAL, SK, NOTULEN,
                 LAPORAN_KEGIATAN, LAPORAN_KEUANGAN, LAINNYA)
  accessLevel  enum(PUBLIC, MEMBER_ONLY, PENGURUS_ONLY, ADMIN_ONLY)
  fileId     FK → files.id  RESTRICT
  periodTermId FK → organization_terms.id  SET NULL
  uploadedById, createdAt, deletedAt
```

**File tidak boleh diakses hanya dengan menebak URL.** Route server
membaca `access_level`, memeriksa permission role, mencatat
`AuditAction.DOWNLOAD`, lalu mengirim via signed URL R2 atau stream.

### 4.9 Notifikasi

```text
notifications
  id, userId (FK CASCADE), type, title, body, linkUrl
  readAt?, createdAt
  1 ─── * User
```

In-app saja. Email/SMS bukan tahap awal.

## 5. Query yang Wajib Diindeks

Contoh query hot path beserta index yang menopangnya:

| Query                                              | Index                     |
| -------------------------------------------------- | ------------------------- |
| Daftar berita published, terbaru                    | `news(status, published_at)` |
| Detail berita by slug                               | unique `news(slug)`       |
| Agenda mendatang                                    | `events(starts_at, status)` |
| Direktori alumni + filter angkatan/universitas      | `members(angkatan, graduation_year)`, `members(university)` |
| Membership aktif seorang member                     | `memberships(member_id, cohort)` |
| Riwayat audit terbaru                               | `audit_logs(created_at)`, `audit_logs(actor_id, created_at)` |
| Dokumen per access level                            | `organization_documents(access_level)` |

## 6. Aturan Keamanan Data

- **Soft delete, bukan hard delete**, untuk anggota, berita, dokumen.
  Data anggota tidak pernah hilang hanya karena status berubah.
- **Kontak sensitif tidak disimpan polos di halaman publik.**
  Nomor HP/email alumni tidak ditampilkan ke publik kecuali anggota
  mencentang `is_directory_visible` (default `false`).
- **Jangan menaruh data pribadi di `audit_logs.metadata`.**
  Simpan id dan nama field, bukan nilai rahasia.
- **Password, token, `AUTH_SECRET`, dan kredensial R2 tidak pernah masuk
  log.** `audit_logs` maupun log server tidak boleh mencatat body request
  mentah.
- **Uang disimpan sebagai `BigInt`.** Hindari pembulatan pada float.

## 7. Migration

```bash
npx prisma migrate dev --name nama_perubahan   # development
npx prisma migrate deploy                      # production
npx prisma migrate status                      # cek status
npx prisma studio                              # inspeksi data (opsional)
```

`migration.sql` di-commit. `prisma db push` **tidak** dipakai di
production karena tidak menghasilkan riwayat.
