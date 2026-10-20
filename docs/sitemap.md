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

```text
/admin                             Dashboard admin
├── /admin/anggota                 Manajemen anggota
├── /admin/alumni                  Manajemen alumni
├── /admin/users                   Manajemen user & role
├── /admin/keuangan                Transaksi & laporan keuangan
├── /admin/arsip                   Arsip dokumen organisasi
├── /admin/audit-log               Log audit
└── /admin/pengaturan              Konfigurasi organisasi (rencana)

/pengurus                          Dashboard pengurus
├── /pengurus/berita               Buat & kelola berita
├── /pengurus/agenda               Buat & kelola agenda
├── /pengurus/proker               Buat & kelola program kerja
├── /pengurus/dokumentasi          Buat & kelola dokumentasi
├── /pengurus/pengumuman           Buat pengumuman
└── /pengurus/anggota              Lihat anggota sesuai permission

/member                            Dashboard anggota
├── /member/kartu                  Kartu anggota digital
└── ...                            Profil, agenda, pengumuman (rencana)

/alumni                            Dashboard alumni
└── ...                            Profil alumni saya (rencana)
```

## 4. Verifikasi & Aset

```text
/member-card/verify/[token]        Verifikasi kartu anggota digital (server)
/api/files/[id]                    Streaming file privat (server, cek RBAC)
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
| `/member`, `/alumni`, `/pengurus`, `/admin` | ❌ | ✅ |
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
