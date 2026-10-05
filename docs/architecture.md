# Arsitektur — KPMBR-YK Platform

Dokumen ini menjelaskan pilihan teknologi, struktur, aliran data, dan model
keamanan. Untuk kebutuhan, lihat `requirements.md`. Untuk database, lihat
`database-design.md`.

## 1. Prinsip Arsitektur

1. **Satu aplikasi.** Next.js melayani website publik, portal internal, dan
   API. Tidak ada backend terpisah.
2. **Server adalah sumber kebenaran.** Setiap keputusan otorisasi, validasi,
   dan perhitungan terjadi di server. Frontend hanya untuk tampilan.
3. **Prisma Schema adalah sumber kebenaran struktur database.** phpMyAdmin
   hanya alat inspeksi.
4. **File binary di luar database.** Cloudflare R2 (S3-compatible). Database
   menyimpan metadata saja.
5. **Sembunyi sampai dibutuhkan.** Tidak ada service infrastruktur yang tidak
   punya kebutuhan nyata (lihat § Open Decisions untuk batasannya).

## 2. Stack Aktual

```text
Framework      Next.js 16.3.8 (App Router, Turbopack, React Server Components)
Runtime        Node.js v24.11.1
Language       TypeScript 5.9.3 (strict)
UI             Tailwind CSS v4.3.3 + shadcn/ui (base: radix, preset: nova)
Icons          lucide-react
Database       MySQL 8.0.30 (Laragon lokal, phpMyAdmin untuk inspeksi)
ORM            Prisma 7.10.0 + @prisma/adapter-mariadb + mysql2
Env            .env (dotenv), .env.example di-commit
Linting        ESLint 9 (eslint-config-next)
Auth           Auth.js v5 — PLANNED (tahap 2)
Object Store   Cloudflare R2 — PLANNED (tahap 2)
Scripts        tsx (smoke test & seed)
```

### Catatan versi penting

- **Primatetama: Prisma 7.10.0, bukan 8.0.0-rc.19.** Tag `latest` di npm
  menunjuk ke release candidate 8.x. Untuk aplikasi produksi, RC pada lapisan
  database berisiko tinggi, jadi dipin ke stabil terbaru. Naik ke 8.x
  dilakukan setelah rilis stabil.
- **Prisma 7 memakai driver adapter.** `PrismaClient` memerlukan adapter
  eksplisit. Untuk MySQL 8, adapter resminya `@prisma/adapter-mariadb`
  (berbasis `mysql2`). Lihat `src/lib/db/prisma.ts`.
- **Prisma 7 membaca konfigurasi dari `prisma7.config.ts`** (bukan
  `package.json#prisma`). `DATABASE_URL` diambil dari environment, bukan
  ditulis di dalam `schema.prisma`.
- **Prisma Client di-generate, tidak di-commit.** Output ke
  `src/generated/prisma` (di-ignore git), di-regenerate lewat `postinstall`.

## 3. Struktur Project

```text
kpmbr/
├── docs/                       # dokumentasi arsitektur & rancangan
├── prisma/
│   ├── schema.prisma           # sumber kebenaran struktur database
│   ├── migrations/             # riwayat migration (WAJIB di-commit)
│   └── ...
├── prisma7.config.ts           # konfigurasi Prisma CLI
├── scripts/
│   └── db-smoke.ts             # verifikasi koneksi & aturan database
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # root layout, metadata global, provider
│   │   ├── globals.css         # DESIGN SYSTEM — token warna, font, radius
│   │   ├── (public)/           # website publik (route group, tanpa URL prefix)
│   │   │   ├── page.tsx        # homepage
│   │   │   ├── berita/
│   │   │   ├── tentang/
│   │   │   ├── proker/
│   │   │   ├── agenda/
│   │   │   ├── dokumentasi/
│   │   │   ├── kepengurusan/
│   │   │   ├── keanggotaan/
│   │   │   └── kontak/
│   │   ├── (auth)/login/       # login (tahap 2)
│   │   ├── member/             # portal anggota (tahap 3)
│   │   ├── alumni/             # portal alumni (tahap 4)
│   │   ├── pengurus/           # portal pengurus (tahap 3)
│   │   ├── admin/              # portal admin (tahap 3)
│   │   ├── member-card/verify/ # verifikasi token kartu digital (tahap 3)
│   │   ├── api/                # route handlers
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                 # komponen shadcn/ui (foundation)
│   │   ├── layout/             # header, footer, nav (shell publik)
│   │   ├── public/             # komponen khusus halaman publik
│   │   ├── member/  admin/     # komponen portal
│   │   └── providers/
│   ├── lib/
│   │   ├── site-config.ts      # identitas situs, navigasi
│   │   ├── db/prisma.ts        # Prisma singleton
│   │   ├── auth/               # Auth.js config, session, RBAC guard (tahap 2)
│   │   ├── validation/         # schema Zod
│   │   ├── storage/            # klien R2 (tahap 2)
│   │   └── utils/              # cn, format rupiah/tanggal
│   ├── modules/                # domain logic per fitur
│   │   ├── users/  members/  alumni/
│   │   ├── news/  programs/  events/
│   │   ├── documentation/  finance/  notifications/
│   │   └── audit/
│   ├── generated/prisma/       # hasil prisma generate (git-ignored)
│   └── types/
├── .env                        # lokal, git-ignored
└── .env.example                # di-commit
```

### Kenapa route group `(public)`?

App Router route group memungkinkan banyak root layout tanpa mengubah URL.
`(public)/page.tsx` → `/`, `(public)/berita/page.tsx` → `/berita`.
Ini memungkinkan website publik dan portal internal memakai layout, font,
dan metadata yang berbeda tanpa menduplikasi struktur.

### Kenapa `modules/` terpisah dari `app/` dan `components/`?

Agar logika domain (validasi, query, aturan bisnis, audit) tidak bercampur
dengan presentasi. `app/` menangani routing & rendering, `modules/` menangani
aturan. Ini memudahkan pengujian unit pada logika tanpa merender React.

## 4. Aliran Data Typical

```text
Browser
  ↓  (form / fetch)
Next.js Server Action atau Route Handler
  ↓
Otorisasi  ← session dari server, bukan dari input klien
  ↓
Validasi    ← Zod, server-side
  ↓
Bisnis      ← src/modules/*
  ↓
Prisma     →  MySQL (metadata & data)
           →  Cloudflare R2 (binary file)
  ↓
Audit log  ← setiap mutasi sensitif tercatat
```

## 5. Model Keamanan

### 5.1 Prinsip

- **Otorisasi di server, selalu.** Contoh yang salah:
  `if (role === "ADMIN") showDeleteButton()` tanpa pengecekan di server.
- **Hanya empat sumber kebenaran untuk role:** session server, record
  `users.role`, dan permission yang dihitung server. Nilai role dari form,
  query string, header, atau body request **tidak pernah** dipercaya.
- **Password tidak pernah disimpan atau di-log dalam bentuk apa pun.**
  Hash memakai argon2id (atau bcrypt) dengan salt otomatis.
- **Account lockout** setelah beberapa kali gagal login, tercatat di
  `users.failed_login_attempts` dan `users.locked_until`.
- **File tidak diakses dengan menebak URL.** Untuk file dengan
  `accessLevel != PUBLIC`, akses hanya lewat route server yang:
  1. mengautentikasi session,
  2. mengecek `accessLevel` terhadap permission role,
  3. mencatat `AuditAction.DOWNLOAD`,
  4. baru mengirim file (signed URL R2 atau stream).
- **Audit log append-only.** `actorId` nullable (aksi sistem/aktor
  terhapus), `action` berupa enum tertutup, `metadata` JSON tidak boleh
  memuat password/token/secret.
- **Soft delete** (`deletedAt`) untuk data yang punya nilai historis
  (anggota, berita, dokumen). Hard delete hanya untuk data tanpa riwayat.

### 5.2 Batasan yang diketahui (akan dikerjakan pada tahap 2)

- Rate limiting login: saat ini baru ada akun lockout per-user
  (`users.locked_until`). Rate limiting per-IP global belum ada.
- Validasi file upload belum ada.
- Signed URL R2 belum ada.

## 6. Strategi Konten & Cache

- Halaman publik yang jarang berubah (tentang, program kerja, dokumentasi)
  menggunakan **ISR** (`revalidate`) agar tidak query MySQL pada setiap
  request.
- Berita & agenda: ISR dengan `revalidate` pendek, di-invalidate lewat
  `revalidatePath()`/`revalidateTag()` setelah mutasi di dashboard.
- Portal internal: **tidak** di-cache. Data per-user tidak boleh bocor lewat
  shared cache.

## 7. SEO & Aksesibilitas

- Metadata global di `src/app/layout.tsx` dengan `metadataBase` dari
  `NEXT_PUBLIC_SITE_URL`.
- `src/app/sitemap.ts` dan `src/app/robots.ts` generate otomatis.
- Semantic HTML: satu `<h1>` per halaman, heading berurutan tanpa lompat.
- `lang="id"`, focus state global, skip link untuk keyboard navigation.
- Kontras warna diverifikasi mengikuti WCAG AA (lihat `design-system.md`).

## 8. Open Decisions — `REQUIRES DECISION`

Poin berikut berdampak besar pada arsitektur dan **tidak** diasumsikan
diam-diam. Perlu keputusan organisasi/seorang owner project:

1. **`REQUIRES DECISION` — Auth.js v5 vs Better Auth.**
   Auth.js v5 masih dalam status yang belum stabil; Better Auth adalah
   rekomendasi komunitas Next.js modern. Keduanya memenuhi kebutuhan, tapi
   pilihan ini menentukan pola session & adapter. Default sementara:
   **Auth.js** sesuai spesifikasi awal. Perlu konfirmasi sebelum
   implementasi tahap 2.
2. **`REQUIRES DECISION` — Model keanggotaan satu-anggota.**
   Schema saat ini mengizinkan satu `Member` memiliki beberapa `Membership`
   (aktif) untuk mendukung re-aktivasi. Jika organisasi memutuskan satu
   orang hanya boleh punya satu membership aktif seumur organisasi, aturan
   itu harus ditegakkan di service layer atau denormalisasi `isCurrent` —
   MySQL tidak mendukung partial unique index.
3. **`REQUIRES DECISION` — Aksesibilitas publik direktori alumni.**
   `Member.isDirectoryVisible` default `false`. Perlu keputusan: apakah
   direktori alumni ditampilkan publik dengan data minimal (nama, angkatan,
   prodi), atau hanya untuk pengguna yang login?
4. **`REQUIRES DECISION` — Granularitas transparansi keuangan.**
   Data keuangan mana yang boleh dilihat ANGGOTA versus PENGURUS belum
   didefinisikan. Jangan implementasi sebelum diputuskan.
5. **`REQUIRES DECISION` — Retensi & penghapusan data.**
   Berapa lama arsip dokumen dan audit log disimpan? Apakah ada kewajiban
   penghapusan data pribadi (UU PDP)? Ini memengaruhi skema soft delete.
6. **`REQUIRES DECISION` — Satu database atau dua.**
   Produksi (public vs portal). Saat ini satu `kpmbr_db`; pemisahan instance
   atau database bisa jadi kebutuhan di masa depan.

## 9. Alasan Penolakan Opsi

| Opsi                                     | Alasan ditolak                                          |
| ---------------------------------------- | ------------------------------------------------------- |
| Backend Express terpisah                 | Duplikasi konfigurasi & deployment; Next.js sudah cukup |
| Prisma 8 RC                              | Lapisan DB terlalu kritis untuk RC                       |
| Menyimpan file binary di MySQL            | Membebani backup & query; skalanya tidak layak           |
| Microservices / Redis / Kafka / Docker   | Belum ada kebutuhan nyata                                |
| Role dari field di form/frontend         | Celah otorisasi klasik; role harus dari server          |
| JWT stateless untuk sesi portal          | Role tidak bisa dicabut tanpa menunggu JWT expire        |

