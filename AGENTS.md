KPMBR-YK Website — Project Context
What this is
Website organisasi KPMBR-YK (Keluarga Pelajar Mahasiswa Bandung Raya Yogyakarta): portal berita/pengumuman, portal anggota/pengurus/alumni/bendahara, CMS, kartu anggota digital (QR), transparansi keuangan, arsip organisasi, audit log.
Tech stack
Next.js (App Router) + TypeScript (strict) + Tailwind CSS v4 + shadcn/ui
Prisma + MariaDB (schema di prisma/, tetap di root)
Satu package.json, satu tsconfig.json — satu unit deployment Next.js (bukan microservices)
Path alias: @/* → ./src/*, @server/* → ./src/server/*, @shared/* → ./src/shared/*, @ui/* → ./src/ui/*
Upload file: .data/uploads/ (lokal; rencana pindah ke Cloudflare R2)
Structure (setelah refactor Fase 1)
src/app/ — routing Next.js, JANGAN dipindah: route groups (auth), (public), admin/, member/, pengurus/, alumni/, bendahara/, api/ (route handlers)
src/server/ — semua kode server-only: auth/, db/, storage/, files/, settings/, actions/, modules/ (hanya .ts: queries, actions, form-actions), audit.ts, crypto.ts, rate-limit*.ts, proxy.ts (middleware)
src/shared/ — tipe, validasi, utils, konten, error, site-config
src/ui/ — semua frontend non-routing: components/ (termasuk modules/*-view.tsx), navigation.ts, dashboard/
src/generated/ — auto-generated (Prisma), git-ignored, jangan disentuh
prisma/, scripts/, public/ — tetap di root
Auth & roles
5 role: ADMIN, PENGURUS, ANGGOTA, ALUMNI, BENDAHARA. Session-based auth + account lockout + rate limiting. 92 test assertion untuk auth/RBAC — harus tetap lolos.
Backlog (di luar refactor ini)
Integrasi Cloudflare R2 untuk upload (ganti penyimpanan lokal)
Transisi membership ANGGOTA → ALUMNI (src/server/actions/alumni.ts)
Notifikasi in-app (model DB sudah ada, UI belum)
Data asli organisasi masih mock di 12 halaman publik (butuh data dari pengurus)
Rules
Windows PowerShell: DILARANG && (pakai ; atau baris terpisah); DILARANG grep, tail, ls -la; pakai Select-String dan Get-ChildItem -Recurse.
DILARANG menampilkan atau mengubah isi .env. DILARANG menghapus file. DILARANG push/merge ke main/master — kerja di branch, user yang merge.
Jangan ubah perilaku aplikasi saat refactor; jangan tambah fitur; jangan upgrade dependency; jangan ubah skema database tanpa diminta.
Komunikasi dengan user dalam Bahasa Indonesia.
Perintah besar yang rapuh (quoting berlapis): tulis dulu ke file .ps1/.js, baru jalankan file-nya — jangan inline -Command "...".
Current state (7 Nov 2026)
Branch aktif: refactor/pisah-frontend-backend. Fase 1 selesai: 130 file dipindah dan tercatat sebagai rename di git; alias baru sudah ditambah ke tsconfig.json.
Fase 2 (perbaiki import dari path lama ke path baru) sedang berjalan; percobaan mass-replace gagal karena error tool — kondisi repo harus dicek dulu dengan git status sebelum lanjut.