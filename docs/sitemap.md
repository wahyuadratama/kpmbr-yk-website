# Sitemap — KPMBR-YK

Struktur URL. Website publik memakai route group `(public)` sehingga tidak
memunculkan prefix di URL.

Dokumen ini mencerminkan **implementasi aktual**. Halaman yang masih
direncanakan ditandai `(rencana)` dan TIDAK boleh ditautkan dari navigasi.

## 1. Website Publik

```text
/                                   Homepage
│
├── /berita                         Daftar berita
│   ├── /berita/[slug]              Detail berita
│   └── /berita/kategori/[slug]     Daftar berita per kategori
│
├── /tentang                        Tentang KPMBR-YK
│   ├── /tentang#sejarah            Sejarah organisasi
│   ├── /tentang#visi               Visi organisasi
│   ├── /tentang#misi               Misi organisasi
│   ├── /tentang#nilai              Nilai organisasi
│   └── /tentang#pengurus           Struktur & divisi
│
├── /kepengurusan                   Kepengurusan saat ini
│   └── /kepengurusan/[periode]     Kepengurusan satu periode
│
├── /proker                         Daftar program kerja
│   └── /proker/[slug]              Detail program kerja
│
├── /agenda                         Daftar agenda
│   └── /agenda/[slug]              Detail kegiatan
│
├── /dokumentasi                    Daftar album
│   └── /dokumentasi/[slug]         Album + galeri
│
├── /berita                         Daftar berita
├── /pengumuman                     Pengumuman publik
│
├── /keanggotaan                    Cara bergabung, syarat, manfaat
│   ├── /keanggotaan#persyaratan
│   ├── /keanggotaan#manfaat
│   └── /keanggotaan#bergabung      Cara bergabung (target CTA "Gabung")
│
├── /alumni-direktori               Direktori alumni publik
│
└── /kontak                         Kontak & lokasi sekretariat
```

### Catatan perubahan struktur

| Rute lama | Status sekarang |
| --------- | ---------------- |
| `/tentang/sejarah`, `/tentang/visi-misi`, `/tentang/nilai`, `/tentang/identitas` | Digantikan **anchor** pada `/tentang` (`#sejarah`, `#visi`, `#misi`, `#nilai`). Sub-halaman terpisah tidak dibuat agar tidak menduplikasi isi dan ficam mudah dinyalin. |
| `/berita?kategori=<slug>` | Diarahkan **permanen (308)** ke `/berita/kategori/<slug>`. Satu URL per isi. |
| `/alumni` | `/alumni` adalah **portal** (butuh login). Direktori **publik** ada di `/alumni-direktori`. |
| `/admin/dokumen` | Digantikan `/admin/arsip`. |

### Halaman tambahan yang direncanakan

```text
/keanggotaan/daftar                Pendaftaran online (menunggu keputusan)
/sitemap.xml                        Dihasilkan otomatis
/robots.txt                        Dihasilkan otomatis
```

## 2. Autentikasi

```text
/login                             Satu halaman login untuk semua role
```

Tidak ada login terpisah untuk anggota dan alumni. Session yang sama,
role berbeda.

## 3. Portal Internal

Semua portal memakai satu kerangka dashboard (sidebar navy + header putih +
area kerja abu-abu muda). Menu tiap portal disaring di server berdasarkan
permission role.

```text
/admin                             Dashboard admin (Admin Control Center)
├── /admin/konten                 CMS Berita & Pengumuman
│   ├── /admin/konten/berita/baru         Tulis berita
│   ├── /admin/konten/berita/[id]         Sunting berita
│   ├── /admin/konten/pengumuman/baru     Buat pengumuman
│   └── /admin/konten/pengumuman/[id]     Sunting pengumuman
├── /admin/proker                 Kelola program kerja
├── /admin/agenda                 Kelola agenda
├── /admin/dokumentasi            Kelola dokumentasi
├── /admin/transaksi              Kelola transaksi keuangan
├── /admin/laporan                Laporan keuangan + persetujuan
├── /admin/anggota                 Manajemen anggota
├── /admin/alumni                  Manajemen alumni
├── /admin/users                   Manajemen user & role
├── /admin/arsip                   Arsip dokumen organisasi
├── /admin/audit-log               Log audit
└── /admin/pengaturan              Pengaturan website + mode maintenance

/bendahara                        Dashboard bendahara (CMS keuangan)
├── /bendahara/transaksi          Transaksi pemasukan & pengeluaran
├── /bendahara/kategori            Kategori keuangan
├── /bendahara/laporan            Laporan + alur persetujuan
└── /bendahara/transparansi       Ringkasan laporan yang terbit

/pengurus                         Dashboard pengurus
├── /pengurus/proker               Kelola program kerja
├── /pengurus/agenda               Kelola agenda
├── /pengurus/dokumentasi          Kelola dokumentasi
├── /pengurus/berita               Kelola berita & pengumuman
└── /pengurus/laporan              Laporan keuangan (read-only)

/member                           Dashboard anggota
├── /member/profil                Profil saya
├── /member/kartu                  Kartu anggota digital
├── /member/agenda                 Agenda
├── /member/pengumuman             Pengumuman
└── /member/transparansi           Transparansi keuangan

/alumni                           Dashboard alumni
├── /alumni/profil                Profil alumni
├── /alumni/agenda                 Agenda
└── /alumni/pengumuman             Pengumuman
```

### Pemisahan halaman publik dan CMS

| Isi | Halaman publik (tanpa login) | Halaman CMS (butuh login) |
| --- | --------------------------- | ------------------------- |
| Program kerja | `/proker`, `/proker/[slug]` | `/admin/proker`, `/pengurus/proker` |
| Agenda | `/agenda`, `/agenda/[slug]` | `/admin/agenda`, `/pengurus/agenda` |
| Dokumentasi | `/dokumentasi`, `/dokumentasi/[slug]` | `/admin/dokumentasi`, `/pengurus/dokumentasi` |
| Berita | `/berita`, `/berita/[slug]`, `/berita/kategori/[slug]` | `/admin/konten` |
| Pengumuman | `/pengumuman` | `/admin/konten` |
| Keuangan | — | `/admin/transaksi`, `/admin/laporan`, `/bendahara/*`, `/pengurus/laporan` |

Tampilan CMS program, agenda, dokumentasi, transaksi, dan laporan memakai SATU
implementasi yang dipakai bersama beberapa portal
(`src/modules/*/admin-view.tsx` dan `src/modules/finance/*-view.tsx`).
Bedanya hanya pada route dan guard portalnya, sehingga navigasi tidak pernah
melompat dari satu portal ke portal lain.

Halaman publik tidak memerlukan login dan hanya menampilkan konten yang
ditujukan untuk publik. Konten berstatus `DRAFT` (program, agenda, berita)
tidak pernah keluar ke halaman publik karena penyaringan status dilakukan di
query.

### Role dan portal

| Role | Portal | Keterangan |
| ---- | ------ | ---------- |
| `ADMIN` | Semua | Pengelola operasional website, bisa menyetujui & menerbitkan laporan |
| `PENGURUS` | `/pengurus` | Modul konten sesuai permission; tanpa administrasi global |
| `BENDAHARA` | `/bendahara` | CMS keuangan; tidak menyentuh role, pengguna, atau pengaturan |
| `ANGGOTA` | `/member` | Data sendiri, agenda, pengumuman, transparansi |
| `ALUMNI` | `/alumni` | Data sendiri, agenda, pengumuman |

## 4. Verifikasi & Aset

```text
/member-card/verify/[token]        Verifikasi kartu anggota digital (server)
/api/files/[id]                    Streaming file privat (server, cek RBAC)
/maintenance                       Halaman pemeliharaan (publik, saat mode aktif)
```

### Aturan URL

- Semua URL memakai huruf kecil + tanda hubung. Tanpa underscore, tanpa
  spasi, tanpa huruf kapital.
- ID database tidak pernah muncul di URL publik. Recipe: `berita/[slug]`,
  bukan `berita/[id]`.
- Detail publik yang tidak punya slug → gunakan `notFound()`.
- Hanya satu URL kanonik per isi. Varian lain diarahkan permanen (308).

## 5. Aturan Akses

| Prefix | Publik | Butuh login |
| ------ | :---: | :---------: |
| `/`, `/berita`, `/berita/kategori/*`, `/tentang`, `/kepengurusan`, `/kepengurusan/*`, `/proker`, `/agenda`, `/dokumentasi`, `/pengumuman`, `/keanggotaan`, `/alumni-direktori`, `/kontak` | ✅ | ❌ |
| `/login` | ✅ | ❌ |
| `/maintenance` | ✅ | ❌ |
| `/member`, `/alumni`, `/pengurus`, `/bendahara`, `/admin` | ❌ | ✅ |
| `/member-card/verify/[token]` | ✅ (token = otorisasi) | ❌ |

## 6. SEO

- Hanya halaman publik masuk sitemap.
- Halaman portal tidak masuk sitemap dan diberi `noindex` via metadata.
- `metadataBase` diset dari `NEXT_PUBLIC_SITE_URL`.
- `generateMetadata()` per halaman berita/agenda/proker untuk title,
  description, Open Graph, dan gambar cover.
- Structured data JSON-LD: `Organization` (homepage),
  `NewsArticle` (detail berita), `Event` (detail agenda).

## 7. Menunggu keputusan organisasi

Dua hal TIDAK bisa diselesaikan tanpa keputusan organisasi. Keduanya
dibiarkan apa adanya — tidak dibuat halaman palsu atau data fiktif.

| Item | Kondisi | Yang dibutuhkan |
| ---- | ------- | ---------------- |
| Banner "Data contoh" (`MockDataNotice`) | Muncul di 12 halaman publik. Banner ini memang disengaja agar data placeholder tidak disalahartikan sebagai data asli. | Data organisasi asli. Setelah tersedia, hapus komponen `MockDataNotice` beserta data seed `prisma/seed.ts`. |
| Pendaftaran daring (`/keanggotaan/daftar`) | Belum ada. Pendaftaran saat ini manual ke Sekretariat; tombol "Gabung" mengarah ke bagian "Cara bergabung" di `/keanggotaan`. | Keputusan alur pendaftaran + infra verifikasi email (token, expiry, throttle) agar tidak dibuka abuse. |
