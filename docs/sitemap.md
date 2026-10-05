# Sitemap — KPMBR-YK

Struktur URL. Website publik memakai route group `(public)` sehingga tidak
memunculkan prefix di URL.

## 1. Website Publik

```text
/                                   Homepage
│
├── /berita                         Daftar berita
│   └── /berita/[slug]              Detail berita
│       └── /berita/kategori/[slug] Daftar berita per kategori
│
├── /tentang                        Tentang KPMBR-YK
│   ├── /tentang/sejarah            Sejarah organisasi
│   ├── /tentang/visi-misi          Visi & misi
│   ├── /tentang/nilai              Nilai organisasi
│   └── /tentang/identitas          Identitas organisasi
│
├── /kepengurusan                   Struktur kepengurusan
│   └── /kepengurusan/[periode]     Kepengurusan periode tertentu
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
├── /keanggotaan                    Cara bergabung, syarat, manfaat
│   ├── /keanggotaan#persyaratan
│   ├── /keanggotaan#manfaat
│   └── /keanggotaan#alur
│
└── /kontak                         Kontak & lokasi sekretariat
```

### Halaman tambahan yang direncanakan

```text
/alumni                            Direktori alumni (tergantung REQUIRES DECISION)
/keanggotaan/daftar                Pendaftaran online (tahap akhir)
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
├── /admin/user                    Manajemen user & role
├── /admin/keuangan                Transaksi & laporan keuangan
├── /admin/dokumen                 Arsip dokumen
├── /admin/audit-log               Audit log
└── /admin/pengaturan              Konfigurasi organisasi

/pengurus                          Dashboard pengurus
├── /pengurus/berita               Buat & kelola berita
├── /pengurus/agenda               Buat & kelola agenda
├── /pengurus/proker               Buat & kelola program kerja
├── /pengurus/dokumentasi          Buat & kelola dokumentasi
├── /pengurus/pengumuman           Buat pengumuman
└── /pengurus/anggota              Lihat anggota sesuai permission

/member                            Dashboard anggota
├── /member/profil                 Profil saya
├── /member/kartu                  Kartu anggota digital
├── /member/agenda                 Agenda
├── /member/pengumuman             Pengumuman
├── /member/proker                 Program kerja
├── /member/dokumentasi            Dokumentasi
└── /member/keuangan               Laporan keuangan (jika ada permission)

/alumni                            Dashboard alumni
├── /alumni/profil                 Profil alumni saya
└── /alumni/direktori              Direktori alumni
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

## 5. Aturan Akses

| Prefix | Publik | Butuh login |
| ------ | :---: | :---------: |
| `/`, `/berita`, `/tentang`, `/kepengurusan`, `/proker`, `/agenda`, `/dokumentasi`, `/keanggotaan`, `/kontak` | ✅ | ❌ |
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
