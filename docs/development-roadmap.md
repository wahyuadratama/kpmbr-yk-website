# Development Roadmap — KPMBR-YK

Status memakai: `PLANNED` → `IN PROGRESS` → `IMPLEMENTED` → `TESTED`.
Feature yang baru skeleton tidak boleh diklaim `TESTED`.

## Stage 0 — Inisialisasi & Fondasi ✅ TESTED

```text
[x] Inspeksi folder & environment
[x] Next.js 16.3.8 + TypeScript + App Router + Tailwind v4 + ESLint
[x] shadcn/ui (base radix) + 20 komponen
[x] Design system KPMBR-YK (token sendiri, bukan template default)
[x] Prisma 7.10.0 + driver adapter MySQL
[x] Database kpmbr_db dibuat, migration init applied (12 tabel)
[x] .env + .env.example + .gitignore aman
[x] Git init
[x] docs/ (6 dokumen)
[x] Public shell: header, navigasi, homepage, footer
[x] Verifikasi: lint, typecheck, build, db smoke test 8/8
```

## Stage 1 — Publikasi & SEO

Status: `IMPLEMENTED` (menunggu data nyata untuk `TESTED`)

```text
[~] Migrasi mock data → database (seed)         — prisma/seed.ts, idempoten
[x] Halaman berita: list + detail + kategori
[x] Halaman tentang: sejarah, visi, misi, nilai
[x] Halaman program kerja: list + detail + progres + riwayat
[x] Halaman agenda: list + detail
[x] Halaman dokumentasi: album + detail
[x] Halaman kepengurusan + divisi + periode
[x] Halaman keanggotaan + kontak
[x] generateMetadata per halaman + JSON-LD
[x] sitemap.xml + robots.ts (dari database)
[x] Optimasi gambar: pipeline aset brand + remotePatterns R2 + next/image
[x] ISR untuk halaman yang jarang berubah
[x] Favicon & logo resmi (lihat docs/design-system.md § 11)
```

Catatan implementasi:

- `prisma/seed.ts` adalah satu-satunya sumber data contoh. Tidak ada lagi
  file mock di `src/`. `npm run db:seed` aman dijalankan berulang.
- Query publik ada di `src/modules/*/queries.ts`, memakai `unstable_cache`
  dengan tag (`news`, `events`, `programs`, `documentation`, `content`,
  `organization`). Dashboard nanti memanggil `revalidateTag`.
- `revalidate`: berita/agenda 5 menit, program 10 menit, dokumentasi/tentang/
  kepengurusan/keanggotaan 1 jam.
- **Tidak ada `loading.tsx` di route group `(public)`.** Alasannya: `notFound()`
  yang dipanggil setelah shell ter-flush akan membalas HTTP 200, sehingga
  halaman 404 terindeks mesin pencari. Status 404 yang benar lebih penting
  daripada skeleton saat memuat.
- Nilai warna disimpan sebagai token (`brand`, `terra`, `info`, `success`)
  di database; kelas Tailwind dipetakan di service layer agar gaya tampilan
  tidak tersebar.
- `MockDataNotice` masih dipakai. Hapus komponen ini beserta data seed setelah
  organisasi menyediakan data asli.
- Driver R2 untuk unggah file **belum** diimplementasikan (masih penyimpanan
  lokal di `.data/uploads`). Yang selesai di tahap ini adalah sisi Consumption:
  `next.config.ts` mengizinkan host dari `R2_PUBLIC_URL`, dan cover berita
  memakai `next/image` bila `coverFile` sudah tertaut dan ber-`accessLevel =
  PUBLIC`. Tanpa URL itu komponen jatuh ke gradient accent, bukan error.
- `publicAssetUrl()` hanya menghasilkan URL untuk aset `PUBLIC`. Aset
  `MEMBER_ONLY`/`PENGURUS_ONLY`/`ADMIN_ONLY` tidak pernah mendapat URL;
  pemanggilnya memakai `/api/files/[id]`.

Keluar dari stage: seluruh website publik terbaca dari database, bukan mock.

## Stage 2 — Autentikasi & RBAC

Status: `TESTED`

```text
[x] AUTH_SECRET di-generate, .env terisi
[x] Auth.js v5 terpasang (credentials)
[x] Halaman /login
[x] Login + logout + session JWT (sub = user id saja)
[x] Account lockout (failed_login_attempts, locked_until)
[x] Rate limiting per IP + per email
[x] requireSession() / requireRole() / requirePermission() di src/lib/auth/
[x] Route terlindungi: /admin /pengurus /member /alumni
[x] Audit log untuk LOGIN, LOGIN_FAILED, LOGOUT, VIEW_SENSITIVE
[x] Seeder: 4 akun dev (admin, pengurus, anggota, alumni)
[x] Halaman 403 (`src/app/forbidden.tsx`) via `authInterrupts`
[x] Redirect login mengikuti role (`src/lib/auth/portals.ts`)
[x] Tes otorisasi: npm run test:auth (92 assertion)
```

### Definition of Done

- [x] Menolak akses langsung ke `/admin` tanpa login (307 → `/login`).
- [x] Menolak `/admin` untuk role ANGGOTA (403).
- [x] Role dari form/query **tidak** berpengaruh pada otorisasi.
- [x] Menonaktifkan akun langsung mencabut sesi.
- [x] Setiap mutasi tercatat di `audit_logs`.
- [x] Test: 6 skenario otorisasi di atas lulus.

### Bug yang ditemukan dan diperbaiki saat Stage 2 diverifikasi

Login **tidak pernah berhasil** sejak pertama kali ditulis, meski cookie sesi
terbit. Dua sebabnya, keduanya soal cara Auth.js v5 dipakai:

1. `signIn(..., { redirect: false })` mengembalikan **string URL redirect**,
   bukan objek `{ ok }`. Kode lama membaca `result.ok` yang selalu
   `undefined`, sehingga login sukses tetap dianggap gagal.
2. `auth()` **tidak bisa** dipakai mengecek hasil login di server action yang
   sama. `signIn()` menulis cookie lewat `cookies().set()`; cookie itu baru
   berlaku pada request berikutnya, jadi `auth()` membaca cookie lama dan
   selalu melihat sesi kosong.

Perbaikannya: kriteria sukses adalah `signIn()` tidak melempar (Auth.js melempar
`CredentialsSignin`/`AccessDenied` saat kredensial ditolak), dan role dibaca
langsung dari baris `users`. Password tidak diverifikasi dua kali.

Bug ini tidak ditemukan oleh `npm run check` maupun `db:smoke` — keduanya tidak
menyentuh alur login. Hanya berbahaya ketika alur itu benar-benar dijalankan
lewat peramban.

### Catatan arsitektur

- `src/lib/auth/portals.ts` adalah satu-satunya sumber pemetaan role ↔ portal.
  Layout `/admin`, `/pengurus`, `/member`, `/alumni`, redirect setelah login,
  dan tes semuanya membaca peta yang sama.
- Pembacaan identitas dipisah ke `src/lib/auth/principal.ts` **tanpa**
  `server-only`, supaya logika otorisasi bisa diuji tanpa HTTP server.
- `requirePortalPage()` memakai `forbidden()` dari `next/navigation` dengan
  `experimental.authInterrupts`, sehingga penolakan benar-benar berstatus 403 —
  bukan 500 dan bukan redirect yang menyamar.

### Yang belum diuji otomatis

Kode status HTTP hasil render (403 dari `forbidden.tsx`, redirect ke `/login`)
diverifikasi manual lewat peramban, belum jadi tes otomatis. Alasannya: butuh
server berjalan, cookie sesi asli, dan peramban. Bila mulai ada dialog
pengguna, tambahkan di Stage 8 bersama pagination.

## Stage 3 — Portal Anggota & Pengurus

Status: `IMPLEMENTED`

```text
[x] Dashboard anggota
[x] Profil saya (edit data sendiri saja)
[x] Dashboard pengurus + modul berita/agenda/proker/dokumentasi/pengumuman
[x] Dashboard admin: user, anggota, alumni
[x] Upload file + validasi (mime, ukuran, magic bytes)
[x] Route /api/files/[id] dengan cek access_level
[x] Audit DOWNLOAD
[ ] Notifikasi in-app
```

## Stage 4 — Kartu Anggota Digital

Status: `IMPLEMENTED`

```text
[x] Model digital_member_cards (tokenHash, bukan token)
[x] Generate kartu + QR (isi = token opaque)
[x] Halaman /member/kartu (QR + preview)
[x] /member-card/verify/[token] validasi server
[x] Revoke kartu
[x] Audit VIEW_SENSITIVE saat verifikasi
```

## Stage 5 — Sistem Alumni

Status: `IMPLEMENTED` — direktori publik `/alumni-direktori` memakai
opt-in `isDirectoryVisible` (default false). Nomor HP dan email tidak
ditampilkan publik.

```text
[x] Halaman alumni (portal)
[x] Direktori alumni + filter (nama, angkatan, universitas, prodi, tahun lulus)
[x] Honorer isDirectoryVisible — opt-in, default false
[x] Nomor HP/email tidak tampil publik
[x] Dashboard alumni + edit profil alumni
[ ] Transisi membership AKTIF → LULUS → role ALUMNI
[x] Riwayat keanggotaan tetap tersimpan
```

## Stage 6 — Transparansi Keuangan

Status: `IMPLEMENTED`

```text
[x] Model financial_categories / financial_transactions / financial_reports
[x] Form transaksi (pemasukan, pengeluaran, kategori, bukti)
[x] Ringkasan: total pemasukan, total pengeluaran, saldo
[x] Laporan bulanan & tahunan
[x] Field visibility per laporan
[x] Permission enforced di server
[x] Audit CREATE/UPDATE/DELETE transaksi
```

Uang `BigInt` → wajib helper `formatRupiah`, dan BigInt tidak boleh
diproses `JSON.stringify` langsung.

## Stage 7 — Arsip Organisasi

Status: `IMPLEMENTED`

```text
[x] Model organization_documents (kategori + access level)
[x] Upload LPJ, proposal, SK, notulen, AD/ART
[x] Browse + filter per kategori
[x] Route akses berbasis permission
[x] Audit CREATE/UPDATE/DELETE dokumen
```

## Stage 8 — Audit Log & Dashboard Admin

Status: `IMPLEMENTED`

```text
[x] Halaman /admin/audit-log + filter (aktor, aksi, resource, rentang tanggal)
[x] Pagination untuk tabel besar
[ ] Retensi/partisi bila volume sudah nyata
```

## Stage 9 — Peraian Website Publik

Status: `IMPLEMENTED`

```text
[x] Navbar: 6 entri (Beranda, Tentang, Organisasi, Kegiatan, Informasi, Gabung)
[x] Konfigurasi navigasi terpusat di src/lib/navigation.ts
[x] Dropdown desktop (klik, keyboard, Escape, klik luar)
[x] Panel menu mobile + accordion
[x] Active state kategori induk
[x] Halaman publik /pengumuman
[x] Halaman /berita/kategori/[slug] + redirect 308 dari ?kategori=
[x] Halaman /kepengurusan/[periode] (riwayat kepengurusan)
[x] Perbaikan direktori alumni (form tanpa style -> komponen UI)
[x] Script check:nav untuk memvalidasi setiap tautan navigasi
```

## Stage 10 — Dashboard & CMS Terpadu

Status: `IMPLEMENTED`

```text
[x] Role BENDAHARA (migrasi enum, permission terpisah)
[x] Design tokens dashboard: navy-biru-putih
[x] DashboardShell: sidebar navy + header putih + area kerja, responsif
[x] Komponen bersama: StatCard, Panel, PageHeading, StatusBadge, Pagination
[x] Admin Control Center: 5 kartu statistik, panel aktivitas, konten
    terbaru, status website, aktivitas terbaru
[x] CMS Berita & Pengumuman: tab, pencarian, filter, pagination, CRUD,
    terbitkan/arsipkan, hapus dengan konfirmasi
[x] Pengaturan website (identitas, kontak, SEO) + kontrol maintenance
[x] Mode maintenance ditegakkan di lapisan request (src/proxy.ts)
[x] CMS Keuangan Bendahara: transaksi, kategori, laporan, transparansi
[x] Alur laporan: draf -> diajukan -> disetujui -> dipublikasikan
[x] Dashboard Pengurus, Anggota, Alumni
[x] Halaman profil, agenda, pengumuman, transparansi untuk anggota/alumni
[x] Script check:schema memvalidasi pemetaan kolom Prisma <-> MySQL
```

Catatan penting:

- **Persetujuan laporan hanya milik ADMIN.** Bendahara menyusun dan
  mengajukan, tetapi tidak dapat menyetujui atau menerbitkan laporannya
  sendiri. Pemisahan ini perlu dikonfirmasi organisasi.
- **Angka laporan dihitung ulang dari transaksi sumber** saat pengajuan,
  sehingga laporan tidak mungkin berbeda dari transaksinya.
- **Maintenance tidak mematikan keamanan.** Halaman privat tetap dapat
  diakses karena masing-masing punya guard sendiri; hanya halaman publik
  yang dialihkan ke `/maintenance`.
- **Bug skema yang ditemukan saat audit:** `FinancialReport.periodType`
  tidak punya `@map("period_type")`, sehingga model itu belum pernah
  berhasil di-query. Diperbaiki dan sekarang dicegah oleh
  `npm run check:schema`.

## Stage 11 — Pemisahan Navigasi Publik & CMS

Status: `IMPLEMENTED`

```text
[x] Navbar publik ditunjuk ke halaman publik yang benar
    (/proker, /agenda, /dokumentasi, /berita, /pengumuman)
[x] Tampilan CMS bersama (satu implementasi, banyak route):
    program, agenda, dokumentasi, transaksi, laporan
[x] Route CMS milik admin: /admin/proker, /admin/agenda,
    /admin/dokumentasi, /admin/transaksi, /admin/laporan
[x] Route CMS untuk pengurus: /pengurus/laporan
[x] Sidebar admin tidak lagi melompat ke portal pengurus/bendahara
[x] check:nav memvalidasi navbar publik, footer, dan sidebar dashboard,
    termasuk asserts bahwa navbar publik tidak menunjuk route privat
[x] Perbaikan: id pada SelectTrigger agar label form benar-benar terhubung
```

Catatan: `mainNav` di `site-config.ts` sudah dihapus pada Stage 9 dan
digantikan `src/lib/navigation.ts` (navbar publik) plus
`src/lib/dashboard/nav.ts` (sidebar dashboard). Keduanya menunjuk route yang
sama-sama sudah diverifikasi oleh `npm run check:nav`.

## Stage 12 — Unggah Gambar, Konten Terpadu & Zona Waktu

Status: `IMPLEMENTED`

```text
[x] Migrasi: Announcement.coverFileId (gambar sampul pengumuman)
[x] Komponen ImagePicker yang bisa dipakai ulang (5 form CMS)
[x] Cover image untuk berita, pengumuman, agenda, program kerja, album
[x] Route publik /api/public-files/<id> untuk aset accessLevel = PUBLIC
[x] publicFileSrc(): URL R2 bila dikonfigurasi, else route publik
[x] Halaman "Semua Konten" (/admin/konten): 5 jenis konten dalam satu tabel
    dengan tab, pencarian, pagination, dan aksi terbitkan/arsipkan/hapus
[x] Halaman publik /pengumann punya filter audiens (Publik / Semua)
[x] src/lib/utils/datetime.ts: input datetime-local & date ditafsirkan
    eksplisit sebagai WIB, tidak bergantung zona server
[x] Tanggal default form transaksi & album memakai hari WIB
```

Catatan:

- Gambar sampul hanya boleh memakai berkas `accessLevel = PUBLIC`; berkas
  non-publik tidak pernah mendapat URL publik.
- Tanpa `R2_PUBLIC_URL`, gambar dilayani route `/api/public-files/<id>`
  (tanpa sesi). Setelah R2 terisi, halaman publik memakai URL R2 langsung.
- Zona waktu organisasi adalah `Asia/Jakarta` (WIB). Semua `DateTime` disimpan
  sebagai UTC, semua input tanggal dari form ditafsirkan sebagai WIB.

## Menunggu keputusan organisasi

Dua item TIDAK dapat diselesaikan tanpa keputusan organisasi. Keduanya
dibiarkan apa adanya — tidak dibuat halaman palsu, data fiktif, atau
tautan ke halaman kosong.

| Item | Kondisi sekarang | Yang dibutuhkan |
| ---- | ----------------- | ---------------- |
| Banner "Data contoh" (`MockDataNotice`) | Muncul di 12 halaman publik. Sengaja, agar data placeholder tidak disalahartikan sebagai data asli. | Data organisasi asli. Setelah tersedia: hapus komponen `MockDataNotice` beserta data seed di `prisma/seed.ts`. |
| Pendaftaran daring (`/keanggotaan/daftar`) | Belum ada. Pendaftaran manual ke Sekretariat; tombol "Gabung" mengarah ke `/keanggotaan#bergabung`. | Keputusan alur pendaftaran + infra verifikasi email (token, expiry, throttle) agar tidak dibuka abuse. |
| Riwayat kepemimpinan per periode | Halaman `/kepengurusan/[periode]` sudah ada, tetapi belum ada data periode (`organization_terms` kosong). | Data periode dan penugasan jabatan dari pengurus. |
| Direktori alumni kosong | Halaman siap, tetapi belum ada anggota yang mengaktifkan `isDirectoryVisible`. | Anggota yang telah lulus memilih menampilkannya. |

## Status Terverifikasi Saat Ini

Audit backend terakhir (lihat git log) menghasilkan bukti:

| Pemeriksaan | Hasil |
| ----------- | ----- |
| `npm run lint` | 0 error (5 warning lama) |
| `npm run typecheck` | bersih |
| `npm run build` | sukses |
| `npm run db:smoke` | 8/8 |
| `npm run test:auth` | 92/92 |
| `npm run check:text` | bersih |
| `npm run check:nav` | semua tautan navbar/footer valid |
| Route publik | 14 route 200, route tak dikenal 404 |
| Rate limit | berbasis database (tabel `rate_limit_buckets`) |
| Transaksi mutasi | seluruh mutasi CMS/keuangan memakai `$transaction` |

## Definition of Done (Umum)

- [x] `npm run lint` bersih
- [x] `npm run typecheck` bersih
- [x] `npm run build` sukses
- [x] `npm run db:smoke` 8/8
- [x] `npm run check:text` bersih
- [x] Route tak dikenal membalas 404 (bukan 200)
- [x] Tidak ada secret di `.env` yang ter-commit (`.env` di-gitignore, `AUTH_SECRET` hanya di `.env`)
- [x] Otorisasi di server, bukan di frontend (92/92 assertion `test:auth`)
- [x] Semua mutasi tercatat di `audit_logs`
- [x] Migration via Prisma, bukan phpMyAdmin

## Risiko & Mitigasi

| Risiko                                         | Mitigasi                                              |
| ---------------------------------------------- | ----------------------------------------------------- |
| Driver C: penuh, `ENOSPC` saat install          | Cache npm dipindah ke D: (`npm config set cache`)     |
| Prisma RC upgrade dari 7 ke 8                    | Dipin ke 7.10.0 stabil; upgrade setelah rilis        |
| Requirement organisasi berubah                   | Design system + RBAC terpusat, bukan tersebar per halaman |
| Data keuangan bocor ke publik                    | Permission server-side + `visibility` per laporan     |
| File sensitif diakses karena URL ditebak        | Route server + cek `access_level` + audit DOWNLOAD    |
| `audit_logs` tumbuh sangat cepat                 | Index sudah disiapkan; partisi jadi-PRN di Stage 8    |