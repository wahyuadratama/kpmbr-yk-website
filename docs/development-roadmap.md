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

Status: `PLANNED`

```text
[ ] Dashboard anggota
[ ] Profil saya (edit data sendiri saja)
[ ] Dashboard pengurus + modul berita/agenda/proker/dokumentasi/pengumuman
[ ] Dashboard admin: user, anggota, alumni
[ ] Upload file ke R2 + validasi (mime, ukuran)
[ ] Route /api/files/[id] dengan cek access_level
[ ] Audit DOWNLOAD
[ ] Notifikasi in-app
```

## Stage 4 — Kartu Anggota Digital

Status: `PLANNED`

```text
[ ] Model digital_member_cards (tokenHash, bukan token)
[ ] Generate kartu + QR (isi = token opaque)
[ ] Halaman /member/kartu (QR + preview)
[ ] /member-card/verify/[token] validasi server
[ ] Revoke kartu
[ ] Audit VIEW_SENSITIVE saat verifikasi
```

## Stage 5 — Sistem Alumni

Status: `PLANNED` — **butuh `REQUIRES DECISION` §8.3**

```text
[ ] Halaman alumni
[ ] Direktori alumni + filter (nama, angkatan, universitas, prodi, tahun lulus)
[ ] Honorer isDirectoryVisible — opt-in, default false
[ ] Nomor HP/email tidak tampil publik
[ ] Dashboard alumni + edit profil alumni
[ ] Transisi membership AKTIF → LULUS → role ALUMNI
[ ] Riwayat keanggotaan tetap tersimpan
```

## Stage 6 — Transparansi Keuangan

Status: `PLANNED` — **butuh `REQUIRES DECISION` §8.4**

```text
[ ] Model financial_categories / financial_transactions / financial_reports
[ ] Form transaksi (pemasukan, pengeluaran, kategori, bukti)
[ ] Ringkasan: total pemasukan, total pengeluaran, saldo
[ ] Laporan bulanan & tahunan
[ ] Field visibility per laporan
[ ] Permission enforced di server
[ ] Audit CREATE/UPDATE/DELETE transaksi
```

Uang `BigInt` → wajib helper `formatRupiah`, dan BigInt tidak boleh
diproses `JSON.stringify` langsung.

## Stage 7 — Arsip Organisasi

Status: `PLANNED`

```text
[ ] Model organization_documents (kategori + access level)
[ ] Upload LPJ, proposal, SK, notulen, AD/ART
[ ] Browse + filter per kategori
[ ] Route akses berbasis permission
[ ] Audit CREATE/UPDATE/DELETE dokumen
```

## Stage 8 — Audit Log & Dashboard Admin

Status: `PLANNED`

```text
[ ] Halaman /admin/audit-log + filter (actor, aksi, resource, rentang tanggal)
[ ] Pagination untuk tabel besar
[ ] Retensi/partisi bila volume sudah nyata
```

## Tahap Berikutnya (Tahap 2) — Rincian

Urutan pengerjaan:

1. **Seeder 1 akun ADMIN.** `prisma/seed.ts` sengaja tidak menyentuh
   `users`; akun administrator dibuat terpisah agar tidak ikut ter-commit.
2. **Helper domain.** `src/lib/utils/format.ts` (rupiah, tanggal Indonesia)
   sudah ada; belum ada helper slug terpisah karena `slugify` sudah ada di
   `format.ts`.
3. **Guard RBAC.** `requireSession()` / `requireRole()` / `requirePermission()`
   di `src/lib/auth/`.
4. **Cache tag.** Query publik sudah punya tag; `revalidateTag` +
   `revalidatePath` dipakai setelah mutasi di dashboard.
5. **Akses file.** Route `/api/files/[id]` dengan cek `access_level` dan
   audit `DOWNLOAD`.

Yang **tidak** dikerjakan di tahap 2: keuangan, alumni, kartu digital.

Status terverifikasi saat Stage 1 selesai: `npm run lint` bersih,
`npm run typecheck` bersih, `npm run build` sukses, `npm run db:smoke` 8/8,
`npm run check:text` bersih, 19 route publik 200 dan 4 route tak dikenal 404.

## Definition of Done (Umum)

- [x] `npm run lint` bersih
- [x] `npm run typecheck` bersih
- [x] `npm run build` sukses
- [x] `npm run db:smoke` 8/8
- [x] `npm run check:text` bersih
- [x] Route tak dikenal membalas 404 (bukan 200)
- [ ] Tidak ada secret di `.env` yang ter-commit
- [ ] Otorisasi di server, bukan di frontend
- [ ] Semua mutasi tercatat di `audit_logs`
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