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
[ ] Optimasi gambar (next/image, R2)
[~] ISR untuk halaman yang jarang berubah
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

Keluar dari stage: seluruh website publik terbaca dari database, bukan mock.

## Stage 2 — Autentikasi & RBAC

Status: `PLANNED` — **butuh keputusan `REQUIRES DECISION` §8.1 lebih dulu**

```text
[ ] AUTH_SECRET di-generate, .env terisi
[ ] Auth.js terpasang (atau Better Auth, sesuai keputusan)
[ ] Halaman /login
[ ] Login + logout + session database
[ ] Account lockout (failed_login_attempts, locked_until)
[ ] Rate limiting per IP
[ ] requireSession() / requireRole() / requirePermission() di src/lib/auth/
[ ] Route terlindungi: /admin /pengurus /member /alumni
[ ] Audit log untuk LOGIN, LOGIN_FAILED, LOGOUT, ROLE_CHANGE
[ ] Seeder: 1 akun ADMIN
```

### Definition of Done

- [ ] Menolak akses langsung ke `/admin` tanpa login (401/redirect).
- [ ] Menolak `/admin` untuk role ANGGOTA (403).
- [ ] Role dari form/query **tidak** berpengaruh pada otorisasi.
- [ ] Menonaktifkan akun langsung mencabut sesi.
- [ ] Setiap mutasi tercatat di `audit_logs`.
- [ ] Test: 6 skenario otorisasi di atas lulus.

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