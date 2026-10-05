# Requirements — KPMBR-YK

Platform digital resmi **KPMBR-YK — Keluarga Pelajar dan Mahasiswa Bandung Raya Yogyakarta**.

Dokumen ini adalah sumber kebenaran kebutuhan fungsional & non-fungsional.
Setiap fitur di sini punya status implementasi; fitur yang hanya dirancang
belum boleh diklaim selesai.

## 1. Ruang Lingkup

```text
KPMBR-YK Platform
├── Website Publik   → tidak perlu login
└── Portal Internal  → login + role-based authorization
```

### 1.1 Di dalam ruang lingkup

- Website publik: profil organisasi, berita, program kerja, agenda, dokumentasi,
  kepengurusan, informasi keanggotaan, kontak.
- Portal internal: dashboard per role, kartu anggota digital, direktori alumni,
  pengumuman, transparansi keuangan (terbatas), arsip dokumen, audit log.
- Sistem backend: autentikasi, RBAC, RBAC server-side, penyimpanan file
  S3-compatible, audit log.

### 1.2 Di luar ruang lingkup (tahap awal)

- Mobile app native.
- Pembayaran online / iuran otomatis.
- Voting elektronik.
- Notifikasi email/SMS massal (hanya notifikasi in-app dulu).
- Integrasi pihak ketiga di luar R2 + Auth.js.

## 2. Peran Pengguna

Empat peran. Satu sistem autentikasi, berbeda hak akses.

| Peran    | Sifat                                            |
| -------- | ------------------------------------------------ |
| ADMIN    | Akses administratif penuh, termasuk keuangan & audit |
| PENGURUS | Akses sesuai tanggung jawab, TIDAK default penuh |
| ANGGOTA  | Akses baca konten + kelola profil sendiri        |
| ALUMNI   | Akses direktori alumni + konten yang diperuntukkan |

Rincian matrix izin: `roles-and-permissions.md`.

## 3. Kebutuhan Fungsional

### 3.1 Website Publik

| ID     | Kebutuhan                                                             | Status    |
| ------ | --------------------------------------------------------------------- | --------- |
| PUB-01 | Daftar berita dengan pagination                                        | IMPLEMENTED (mock) |
| PUB-02 | Detail berita via slug SEO-friendly (`/berita/[slug]`)                | IMPLEMENTED (mock) |
| PUB-03 | Kategori berita                                                        | PLANNED   |
| PUB-04 | Featured news di homepage                                              | IMPLEMENTED (mock) |
| PUB-05 | Cover image, author, tanggal publikasi                                  | IMPLEMENTED (mock) |
| PUB-06 | Draft/published status                                                 | PLANNED   |
| PUB-07 | Halaman Tentang: sejarah, visi, misi, nilai, identitas                 | IMPLEMENTED (mock) |
| PUB-08 | Program kerja terstruktur (nama, divisi, PIC, tujuan, timeline, status, progress) | IMPLEMENTED (mock) |
| PUB-09 | Agenda kegiatan (tanggal, jam, lokasi, penyelenggara, status)          | IMPLEMENTED (mock) |
| PUB-10 | Album dokumentasi + foto                                               | IMPLEMENTED (mock) |
| PUB-11 | Struktur kepengurusan (jabatan, foto, periode)                          | IMPLEMENTED (mock) |
| PUB-12 | Informasi keanggotaan: cara bergabung, syarat, manfaat, alur            | PLANNED   |
| PUB-13 | Halaman kontak                                                          | PLANNED   |

### 3.2 Portal Internal

| ID     | Kebutuhan                                                        | Status  |
| ------ | ----------------------------------------------------------------- | ------- |
| INT-01 | Login satu halaman (`/login`)                                     | PLANNED |
| INT-02 | Logout                                                            | PLANNED |
| INT-03 | Session server-side yang bisa dicabut                             | PLANNED |
| INT-04 | Protected routes per role (admin/pengurus/anggota/alumni)         | PLANNED |
| INT-05 | Dashboard anggota (status, kartu, agenda, pengumuman, proker)     | PLANNED |
| INT-06 | Kartu anggota digital + QR dengan token verifikasi aman           | PLANNED |
| INT-07 | Verifikasi kartu anggota di server (`/member-card/verify/[token]`) | PLANNED |
| INT-08 | Dashboard alumni + direktori alumni dengan filter                | PLANNED |
| INT-09 | Filter direktori: nama, angkatan, universitas, prodi, tahun lulus  | PLANNED |
| INT-10 | Jangan menampilkan nomor HP/email alumni ke publik                  | PLANNED (schema mendukung `isDirectoryVisible`) |
| INT-11 | Manajemen pengumuman bertARGET (PUBLIC/ANGGOTA/ALUMNI/PENGURUS)   | PLANNED |
| INT-12 | Transparansi keuangan: pemasukan, pengeluaran, saldo, kategori     | PLANNED |
| INT-13 | Laporan keuangan bulanan & tahunan                                | PLANNED |
| INT-14 | Arsip dokumen (AD/ART, LPJ, proposal, SK, notulen, laporan)        | PLANNED |
| INT-15 | Access level dokumen PUBLIC/MEMBER_ONLY/PENGURUS_ONLY/ADMIN_ONLY   | IMPLEMENTED (schema) |
| INT-16 | Audit log aktivitas                                               | IMPLEMENTED (schema) |

### 3.3 Sistem

| ID     | Kebutuhan                                                          | Status            |
| ------ | ------------------------------------------------------------------ | ----------------- |
| SYS-01 | Password hashing (argon2id atau bcrypt dengan cost factor memadai) | PLANNED |
| SYS-02 | Rate limiting pada login                                            | PLANNED          |
| SYS-03 | Otorisasi server-side pada setiap Server Action & Route Handler    | PLANNED          |
| SYS-04 | Validasi input (server-side, semua mutasi)                           | PLANNED          |
| SYS-05 | Validasi file (mime, ukuran, ekstensi)                              | PLANNED          |
| SYS-06 | Secure cookies + session management                                  | PLANNED          |
| SYS-07 | Object storage S3-compatible (Cloudflare R2) untuk file binary      | PLANNED          |
| SYS-08 | Metadata file tersimpan di database, bukan binary                    | IMPLEMENTED (schema) |
| SYS-09 | SEO: metadata, OG, sitemap, robots.txt, semantic HTML, structured data | PARTIAL (metadata & robots) |
| SYS-10 | Aksesibilitas: semantic HTML, keyboard nav, focus state, alt, kontras | PARTIAL           |

## 4. Kebutuhan Non-Fungsional

- **Performa:** LCP < 2.5s pada koneksi 4G; halaman publik umumnya static
  (ISR) agar tidak membebani MySQL.
- **Keamanan:** RBAC ditegakkan di server. Tidak ada keputusan otorisasi
  yang hanya relies pada frontend. Lihat `architecture.md` § Security.
- **Skalabilitas:** Tanpa microservice/Redis/Kafka pada tahap awal
  (lihat `development-roadmap.md`).
- **Maintainability:** Modularitas per domain (`src/modules/*`), Design System
  terpusat, satu sumber kebenaran untuk token UI (`globals.css`).
- **Responsif:** Desktop, laptop, tablet, mobile. Mobile menjadi prioritas
  untuk portal anggota.
- **Aksesibilitas:** Target WCAG 2.1 AA.

## 5. Batasan & Asumsi

- MySQL 8 lokal via Laragon; root tanpa password (default Laragon) — hanya
  untuk development.
- `phpMyAdmin` HANYA untuk melihat/menelusuri data. Struktur database SELALU
  melalui Prisma Migrate.
- Tidak ada requirement spesifik dari organisasi tentang besaran iuran, struktur
  divisi, atau periode kepengurusan → konten awal memakai mock data yang
  ditandai jelas.
- Requirement yang ambigu & berdampak besar ditandai `REQUIRES DECISION`
  (lihat `architecture.md` § Open Decisions).

## 6. Di Luar Ruang Lingkup (Eksplisit)

Microservices, Redis, Kafka, Docker, Kubernetes, backend Express terpisah.
Tidak digunakan pada tahap awal karena belum ada kebutuhan nyata.
