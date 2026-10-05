# Design System — KPMBR-YK

Token tunggal di `src/app/globals.css`. Semua halaman memakai token itu.
Tidak ada warna, radius, atau shadow yang ditulis manual per komponen.

Nama design: **"Kembangembler"**.

## 1. Karakter

```text
Modern · Professional · Youthful · Clean · Elegant · Trustworthy
```

Identitas Yogyakarta/Jawa dipakai subtle:

- Dasar netral hangat (putih tulang, bukan putih murni) →Nuansa tanah Bandung.
- Primary indigo → langit sore Yogyakarta. Tenang, tepercaya, resmi.
- Accent terakota → gerbangateway. Energi muda, hangat.
- Huruf geometric sans → modern, mudah dibaca di layar kecil.

Yang dihindari: gradient berlebihan, glassmorphism berlebihan, animasi
berlebihan, terlalu banyak warna, terlalu banyak card, border radius
berlebihan, template corporate generik.

## 2. Warna

Semua warna dalam `oklch()` agar perceived lightness konsisten dan kontras
dapat dikendalikan. Sumber: CSS variable, bukan nilai hex per komponen.

### Light

| Token                    | Nilai                        | Pakai untuk                        |
| ------------------------ | ---------------------------- | ---------------------------------- |
| `--background`           | `oklch(0.995 0.002 90)`     | Latar halaman                      |
| `--foreground`           | `oklch(0.19 0.015 265)`     | Teks utama                         |
| `--surface`              | `oklch(1 0 0)`              | Kartu, panel                       |
| `--surface-muted`        | `oklch(0.975 0.004 90)`     | Latar sektor, placeholder          |
| `--primary`              | `oklch(0.38 0.105 258)`     | Tombol utama, tautan, active state |
| `--primary-foreground`   | `oklch(0.985 0.002 90)`     | Teks di atas primary               |
| `--accent`               | `oklch(0.955 0.022 70)`     | Highlight halus, hover row         |
| `--accent-foreground`    | `oklch(0.34 0.07 55)`       | Teks di atas accent                |
| `--terra`                | `oklch(0.62 0.135 48)`      | Aksen categorical (grafik)        |
| `--muted-foreground`     | `oklch(0.5 0.014 265)`      | Teks sekunder                      |
| `--border`               | `oklch(0.91 0.006 90)`      | Garis pemisah                      |
| `--ring`                 | `oklch(0.45 0.1 258)`       | Focus ring                         |
| `--destructive`          | `oklch(0.55 0.205 26)`      | Hapus, error                       |
| `--success`              | `oklch(0.53 0.115 155)`     | Sukses, status AKTIF               |
| `--warning`              | `oklch(0.68 0.145 75)`      | Peringatan                         |
| `--info`                 | `oklch(0.56 0.105 225)`     | Informasi                          |

### Dark

Dark mode punya token lengkap di `.dark` (bukan sekadar inversi).
Portal internal akan memakainya untuk sesi malam.

### Aturan warna

- **Maksimal 2 warna merek** dalam satu tampilan: `primary` + satu aksen.
- Warna status (`success`/`warning`/`destructive`/`info`) hanya untuk
  makna status, bukan dekorasi.
- Warna tidak pernah menjadi satu-satunya penanda — selalu disertai teks
  atau ikon (accessibility).

## 3. Tipografi

| Token                   | Nilai                | Pakai untuk          |
| ----------------------- | -------------------- | -------------------- |
| `--font-kpmbr-sans`     | Geist Sans           | Body + heading       |
| `--font-kpmbr-mono`     | Geist Mono           | Kode, ID, nomor KW   |

Hierarchy:

```text
h1  text-4xl / text-5xl   font-semibold  tracking-tight
h2  text-3xl               font-semibold  tracking-tight
h3  text-2xl               font-semibold
h4  text-xl                font-semibold
body text-base             font-normal
small text-sm              font-normal
meta text-xs               font-normal  text-muted-foreground
```

Semua heading memakai `tracking-tight` + `text-balance` agar tidak ada
kata yang terpotong aneh saat wrap. `leading-relaxed` untuk paragraf
panjang agar mudah dibaca.

## 4. Spacing

Skala Tailwind bawaan. Aturan rumah:

- Padding card: `p-6` (desktop), `p-4` (mobile).
- Gap antar section: `py-16` desktop, `py-12` mobile.
- Gap antar item dalam grid: `gap-6` atau `gap-8`.
- Container: `max-w-6xl` untuk konten, `max-w-3xl` untuk artikel.

## 5. Border Radius

```text
--radius     0.5rem  (8px)   base
--radius-sm  0.25rem          badge, tag, input kecil
--radius-md  0.375rem         input, select
--radius-lg  0.5rem           card, button
--radius-xl  0.625rem
--radius-2xl 0.75rem
--radius-3xl 0.875rem
--radius-4xl 1rem
```

Restrained. Tidak ada `rounded-full` untuk container besar — pill hanya
untuk badge status dan avatar.

## 6. Shadow

```text
--shadow-elevated  0 1px 2px rgb(… / 4%), 0 4px 16px rgb(… / 6%)
--shadow-overlay   0 8px 32px rgb(… / 12%)
```

Maksimal dua tingkat shadow. Card default tidak memakai shadow — memakai
`border`. Shadow hanya untuk elemen yang benar-benar mengambang (dropdown,
dialog, popover, drawer).

## 7. Komponen

Semua komponen ada di `src/components/ui/` (shadcn/ui) dan sudah
di-t overriding token KPMBR-YK lewat CSS variable.

| Komponen          | Catatan KPMBR-YK                                    |
| ----------------- | ------------------------------------------------ |
| Button            | 5 variant: default, secondary, outline, ghost, destructive |
| Card              | Border, bukan shadow. Radius `lg`                |
| Badge             | Untuk status: AKTIF, PENDING, DIBATALKAN, dll    |
| Input / Textarea  | Focus ring `ring` (indigo), bukan biru default    |
| Label             | Wajib ada untuk setiap field                    |
| Select            | Native select styling via shadcn                 |
| Dialog / Sheet    | Sheet untuk navigasi mobile, Dialog untuk konfirmasi |
| Alert / AlertDialog | Konfirmasi destructive wajib AlertDialog       |
| Table             | Dipakai di dashboard, selalu dengan wrapper overflow |
| Tabs              | Untuk berpindah view di dashboard                |
| Tooltip           | Membungkus komponen di root layout              |
| Sonner (Toast)    | Toast untuk hasil mutasi                         |
| Skeleton          | Loading state, bukan spinner untuk layout        |
| Accordion         | FAQ di halaman keanggotaan                       |
| Separator         | Pembatas seksi                                 |

## 8. State yang Wajib Ada

Setiap data-driven view wajib punya keempat state ini:

| State        | Pola                                                        |
| ------------ | ----------------------------------------------------------- |
| Loading      | `loading.tsx` di route + `Skeleton` untuk inline            |
| Empty        | Komponen `EmptyState` (ikon + judul + deskripsi + aksi)     |
| Error        | `error.tsx` di route, pesan ramah + tombol coba lagi        |
| Success      | Toast (Sonner) + pembaruan data                            |

Jangan pernah menampilkan halaman kosong tanpa penjelasan saat data kosong.

## 9. Motion

Santai. Hanya transisi yang informatif:

- Hover/focus: `transition-colors duration-150`.
- Dialog/sheet: animasi dari shadcn, tidak diedit.
- Tidak ada animasi masuk halaman yang mengganggu.
- Hormati `prefers-reduced-motion`.

## 10. Aksesibilitas

| Aspek                | Aturan                                                    |
| -------------------- | --------------------------------------------------------- |
| Kontras              | Teks utama ≥ 4.5:1, teks besar ≥ 3:1 (WCAG AA)            |
| Focus                | `outline-2 outline-offset-2` via `focus-visible` global   |
| Keyboard             | Semua interaktif dapat diakses Tab. Skip link di atas    |
| Label                | Setiap input punya `<label>` yang terhubung               |
| Alt text             | Gambar konten punya alt deskriptif, bukan `alt="foto"`    |
| Heading              | Satu `<h1>` per halaman, urutan heading tanpa lompat        |
| Dialog               | Focus trap + Escape menutup (shadcn/Radix sudah menyediakan) |
| Bahasa               | `<html lang="id">`                                        |
| Ikon                 | Ikon dekoratif `aria-hidden`; ikon actionable punya label  |
| Link                | Teks link ada, tidak `klik di sini`                       |

## 11. Identitas Visual

Logo resmi sudah dipakai. Berkas sumber adalah
`src/assets/kpmbr-logo-source.png` (PNG dengan latar transparan). Semua varian
diturunkan dari berkas itu oleh `npm run assets:brand`
(`scripts/build-brand-assets.ts`) — jangan mengedit hasil turunannya langsung.

```text
src/assets/kpmbr-logo-source.png   500x500   sumber, hanya boleh diganti
src/assets/kpmbr-logo.png          192px     navbar & footer
src/app/icon.png                   256px     favicon
src/app/apple-icon.png             180px     ikon iOS (spesifikasi Apple)
```

Aturan penggunaan:

- Lockup dipakai lewat komponen `Brand` (`src/components/layout/brand.tsx`).
  Jangan menulis `<Image>` logo langsung di halaman atau komponen lain.
- `variant="full"` untuk header/footer (logo + nama), `variant="mark"` untuk
  panel sempit seperti menu mobile.
- Logo bersifat dekoratif: `alt=""`. Nama organisasi diambil dari `aria-label`
  pada link, bukan dari teks alternatif gambar.
- Wajib menyertakan `sizes` pada `next/image`. Tanpa itu Next mengira lebar
  gambar 100vw dan mengunduh varian yang jauh lebih besar dari kebutuhan.
- Logo maupun hasil turunannya tidak boleh diberi `favicon.ico`. Next.js akan
  mengutamakan `favicon.ico` dan mengabaikan `src/app/icon.png`.
- Latar transparan dipertahankan; jangan menambahkan kotak putih di belakang
  logo.

Variabel warna yang dipakai logo (biru-kuning) tidak sama dengan token `brand`
di stylesheet. Itu tidak masalah: token adalah warna antarmuka, logo adalah
aset organisasi yang tidak diwarnai ulang.

## 12. Penggunaan Token di Tailwind

Token diekspos lewat `@theme inline`, jadi tersedia sebagai utility:

```text
bg-background      text-foreground
bg-surface         bg-surface-muted
bg-primary         text-primary-foreground
bg-terra           text-terra-foreground
bg-brand-muted     text-brand-muted-foreground
text-muted-foreground
border-border      ring-ring
text-success  text-warning  text-destructive  text-info
rounded-sm / md / lg / xl / 2xl
shadow-elevated  shadow-overlay
```

Jarang perlu menulis warna langsung. Kalau memang perlu, pakai token —
bukan hex.