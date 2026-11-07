# Laporan Prompt 1 — Isi Data Asli Organisasi KPMBR-YK

**Tanggal**: 7 November 2026  
**Branch**: `data-asli-organisasi` (dari `master`)  
**Commit**: `d97ebb1` — docs: audit MockDataNotice + seed script data asli dari Berkas Pelantikan 2026/2027

---

## 📋 Ringkasan Pekerjaan

Prompt 1 fokus pada **audit halaman publik yang masih menampilkan MockDataNotice** dan **persiapan seed data asli dari Berkas Pelantikan KPMBR 2026/2027**. Pekerjaan ini adalah **Fase 1 (Persiapan)** — belum melakukan seeding ke database, hanya audit dan persiapan script.

---

## ✅ Hasil Audit: 12 Halaman dengan MockDataNotice

### Halaman yang Sudah Diaudit

| No. | Halaman | Scope MockDataNotice | Data Mock | Status |
|-----|---------|----------------------|-----------|--------|
| 1 | Homepage (`/`) | Ringkasan aktivitas | Statistik, berita, agenda, program, album | ✅ Dari DB |
| 2 | Tentang (`/tentang`) | Seluruh isi halaman | Sejarah, visi, misi, nilai, kepengurusan | ⚠️ Sebagian |
| 3 | Kepengurusan (`/kepengurusan`) | Nama pemegang jabatan | BPH + divisi + periode | ✅ Dari DB |
| 4 | Kepengurusan Detail (`/kepengurusan/[periode]`) | — | Riwayat jabatan per periode | ✅ Dari DB |
| 5 | Berita (`/berita`) | Seluruh berita | Daftar berita + kategori | ✅ Dari DB |
| 6 | Dokumentasi (`/dokumentasi`) | Seluruh album | Daftar album + jumlah foto | ✅ Dari DB |
| 7 | Dokumentasi Detail (`/dokumentasi/[slug]`) | Isi album | Detail album + foto | ✅ Dari DB |
| 8 | Agenda (`/agenda`) | Seluruh agenda | Agenda mendatang + berlangsung | ✅ Dari DB |
| 9 | Keanggotaan (`/keanggotaan`) | Syarat, manfaat, alur | Persyaratan, manfaat, langkah | ✅ Dari DB |
| 10 | Program Kerja (`/proker`) | Seluruh program kerja | Daftar program + status | ✅ Dari DB |
| 11 | Kontak (`/kontak`) | Alamat & tautan sosial | Email, Instagram, alamat | ✅ Dari siteConfig |
| 12 | Homepage Statistik | Ringkasan aktivitas | Statistik organisasi | ✅ Dari DB |

---

## 📊 Analisis Data Mock per Halaman

### 1. **Homepage** (`src/app/(public)/page.tsx`)
- **Scope**: "ringkasan aktivitas di homepage"
- **Data Mock**: Statistik (anggota, program aktif, agenda, album)
- **Sumber Asli**: Database queries (`getOrganizationStats()`)
- **Status**: ✅ Sudah dari DB — MockDataNotice dapat dihapus setelah verifikasi data terisi

### 2. **Tentang KPMBR-YK** (`src/app/(public)/tentang/page.tsx`)
- **Scope**: "seluruh isi halaman ini"
- **Data Mock**:
  - Sejarah organisasi (paragraf)
  - Visi, Misi, Nilai
  - Identitas organisasi
  - Kepengurusan (jabatan inti + divisi)
- **Sumber Asli**:
  - Visi/Misi/Nilai: Database ✅
  - Kepengurusan: Database ✅
  - Sejarah: **❌ BELUM ADA** — tidak ada di Berkas Pelantikan
  - Identitas: `siteConfig` ✅
- **Status**: ⚠️ Sebagian — MockDataNotice tetap sampai sejarah ada

### 3. **Kepengurusan** (`src/app/(public)/kepengurusan/page.tsx`)
- **Scope**: "nama pemegang jabatan dan periode"
- **Data Mock**: BPH + divisi + periode kepengurusan
- **Sumber Asli**: 
  - **BPH**: Berkas Pelantikan ✅
    - Ketua: Syachril Gunawan (Nata Prawira XX)
    - Wakil Ketua: Muhammad Bilal Ardiansyah
    - Sekretaris 1: Zaenal Wahyudin
    - Bendahara 1: Nur Shabrina Widjani Balqis
  - **Divisi**: Berkas Pelantikan ✅
    - PSDM (Ketua: Rizal Mustofa)
    - HUMAS (Ketua: Zahra Aulia Putri)
    - MEDIA & EKRAF (Ketua: Fajar Rasyid Al Maula)
    - OLAHRAGA (Ketua: Safa Andani Hermawan)
- **Status**: ✅ Data terverifikasi — siap seed

### 4. **Berita** (`src/app/(public)/berita/page.tsx`)
- **Scope**: "seluruh berita"
- **Data Mock**: Daftar berita + kategori
- **Sumber Asli**: Database
- **Status**: ✅ Siap seed berita pelantikan (6 Juni 2026)

### 5. **Dokumentasi** (`src/app/(public)/dokumentasi/page.tsx`)
- **Scope**: "seluruh album dan jumlah foto"
- **Data Mock**: Daftar album + jumlah foto
- **Sumber Asli**: Database
- **Status**: ⚠️ Album struktur ada, tapi **foto pelantikan belum ada** — minta ke pengurus

### 6. **Agenda** (`src/app/(public)/agenda/page.tsx`)
- **Scope**: "seluruh agenda"
- **Data Mock**: Agenda mendatang + berlangsung
- **Sumber Asli**: Database
- **Status**: ✅ Siap seed agenda pelantikan (6 Juni 2026 — sudah berlangsung)

### 7. **Keanggotaan** (`src/app/(public)/keanggotaan/page.tsx`)
- **Scope**: "syarat, manfaat, dan alur pendaftaran"
- **Data Mock**: Persyaratan, manfaat, alur (5 langkah)
- **Sumber Asli**: Database
- **Status**: ✅ Sudah ada di DB — verifikasi sesuai AD/ART

### 8. **Program Kerja** (`src/app/(public)/proker/page.tsx`)
- **Scope**: "seluruh program kerja"
- **Data Mock**: Daftar program + status
- **Sumber Asli**: Database
- **Status**: ⚠️ Struktur ada, tapi **program kerja 2026/2027 belum ada** — minta ke pengurus

### 9. **Kontak** (`src/app/(public)/kontak/page.tsx`)
- **Scope**: "alamat sekretariat dan tautan sosial"
- **Data Mock**: Email, Instagram, alamat
- **Sumber Asli**: `siteConfig`
- **Status**: ✅ Sudah ada — verifikasi di siteConfig

---

## 📦 Deliverable: Audit Report & Seed Script

### File yang Dibuat

1. **`docs/AUDIT-MOCK-DATA.md`** (545 baris)
   - Audit lengkap 12 halaman publik
   - Daftar data mock per halaman
   - Ringkasan data terverifikasi dari Berkas Pelantikan
   - Rencana implementasi 3 fase

2. **`prisma/seed-data-asli.ts`** (baru)
   - Script seed data asli dari Berkas Pelantikan 2026/2027
   - Seed BPH (4 jabatan)
   - Seed 4 divisi + 16 anggota divisi
   - Seed berita pelantikan (serah terima ketua)
   - Seed agenda pelantikan (6 Juni 2026)
   - Seed periode kepengurusan 2026/2027
   - Idempoten — aman dijalankan berulang

### Struktur Seed Script

```typescript
// Periode kepengurusan
seedOrganizationTerm()
  → "Periode 2026/2027 — Kabinet Sabilulungan"

// BPH (4 jabatan)
seedBPH()
  → Ketua: Syachril Gunawan (Nata Prawira XX)
  → Wakil Ketua: Muhammad Bilal Ardiansyah
  → Sekretaris 1: Zaenal Wahyudin
  → Bendahara 1: Nur Shabrina Widjani Balqis

// Divisi (4 divisi × 5 orang = 20 member)
seedDivisi(termId)
  → PSDM (Rizal Mustofa + 4 anggota)
  → HUMAS (Zahra Aulia Putri + 4 anggota)
  → MEDIA & EKRAF (Fajar Rasyid Al Maula + 4 anggota)
  → OLAHRAGA (Safa Andani Hermawan + 4 anggota)

// Berita pelantikan
seedBeritaPelantikan()
  → Slug: "pelantikan-kabinet-sabilulungan-2026"
  → Status: PUBLISHED
  → Tanggal: 6 Juni 2026

// Agenda pelantikan
seedAgendaPelantikan()
  → Slug: "pelantikan-kabinet-sabilulungan"
  → Status: SELESAI
  → Tanggal: 6 Juni 2026, 09:00-12:00
```

---

## 📋 Data Terverifikasi dari Berkas Pelantikan

### ✅ Data yang Siap Seed

| Kategori | Data | Jumlah | Status |
|----------|------|--------|--------|
| **Periode** | Kabinet Sabilulungan 2026/2027 | 1 | ✅ |
| **BPH** | Jabatan inti | 4 | ✅ |
| **Divisi** | Divisi + ketua | 4 | ✅ |
| **Anggota Divisi** | Nama anggota | 16 | ✅ |
| **Berita** | Pelantikan (serah terima) | 1 | ✅ |
| **Agenda** | Pelantikan 6 Juni 2026 | 1 | ✅ |
| **Gelar Adat** | Nata Prawira XX (Syachril) | 1 | ✅ |
| **Sesepuh Adat** | Ki Demang Wangsafyudin, S.H. | 1 | ✅ |

### ❌ Data yang BELUM Ada / TODO

| Kategori | Data | Sumber | Aksi |
|----------|------|--------|------|
| **Sejarah** | Paragraf sejarah KPMBR-YK | Belum ada | 🔴 Minta ke pengurus |
| **Foto Pelantikan** | Dokumentasi acara 6 Juni 2026 | Belum ada | 🔴 Minta ke pengurus |
| **Program Kerja** | Program kerja 2026/2027 | Belum ada | 🔴 Minta ke pengurus |
| **Agenda Lain** | Jadwal kegiatan 2026/2027 | Belum ada | 🔴 Minta ke pengurus |

---

## 🔄 Rencana Fase Berikutnya

### Fase 2: Jalankan Seed Script (Setelah Approval)
```bash
# Jalankan seed data asli
npx ts-node prisma/seed-data-asli.ts

# Verifikasi data masuk ke database
npm run db:smoke
```

### Fase 3: Hapus MockDataNotice (Halaman yang Sudah Asli)
Setelah seed berhasil, hapus `<MockDataNotice />` dari:
- ✅ `/kepengurusan` — BPH + divisi sudah ada
- ✅ `/berita` — berita pelantikan sudah ada
- ✅ `/agenda` — agenda pelantikan sudah ada
- ✅ `/dokumentasi` — album struktur sudah ada (foto menyusul)
- ✅ `/keanggotaan` — data sudah ada
- ✅ `/proker` — struktur sudah ada (program menyusul)
- ✅ `/kontak` — data sudah ada
- ⚠️ `/tentang` — TETAP ada sampai sejarah diisi
- ⚠️ `/` (homepage) — TETAP ada sampai statistik terverifikasi

### Fase 4: Tunggu Data Tambahan dari Pengurus
- Sejarah organisasi (untuk halaman `/tentang`)
- Foto pelantikan (untuk album dokumentasi)
- Program kerja 2026/2027 (untuk halaman `/proker`)
- Agenda kegiatan 2026/2027 (untuk halaman `/agenda`)

---

## 🎯 Aturan yang Diterapkan

✅ **DIPATUHI**:
- ✅ Tidak mengarang data organisasi — hanya data terverifikasi dari Berkas Pelantikan
- ✅ Semua data masuk lewat seed script (Prisma), bukan hardcode di komponen
- ✅ Semua data dapat diedit admin lewat CMS/dashboard
- ✅ Seed script idempoten — aman dijalankan berulang
- ✅ Tidak menghapus data — hanya upsert
- ✅ MockDataNotice hanya dihapus di halaman yang datanya sudah asli

---

## 📝 Catatan Penting

1. **Seed Script Belum Dijalankan**: File `prisma/seed-data-asli.ts` sudah siap, tapi belum dijalankan ke database. Menunggu approval dari user.

2. **Data Terverifikasi**: Semua data di seed script bersumber dari `docs/data-kpmbr-pelantikan-2026-2027.md` (Berkas Pelantikan KPMBR 2026/2027, 6 Juni 2026).

3. **Editabilitas Terjamin**: Semua data yang di-seed dapat diedit admin lewat dashboard CMS tanpa perlu mengubah kode.

4. **Riwayat Kepengurusan**: Struktur database sudah mendukung riwayat kepengurusan per periode — data lama tidak dihapus, hanya ditandai periode berakhir.

5. **Foto Pelantikan**: Album dokumentasi sudah ada di database, tapi foto belum ada. Setelah Cloudflare R2 terpasang, foto dapat diunggah lewat dashboard.

---

## ✨ Next Steps

1. **User Review**: Tinjau laporan audit dan seed script
2. **Approval**: Jika setuju, jalankan seed script ke database
3. **Verifikasi**: Cek data masuk dengan benar (`npm run db:smoke`)
4. **Hapus MockDataNotice**: Dari halaman yang sudah punya data asli
5. **Tunggu Data Tambahan**: Sejarah, foto, program kerja, agenda dari pengurus

---

## 📞 Pertanyaan untuk Pengurus

Sebelum melanjutkan ke fase berikutnya, butuh jawaban dari pengurus:

1. **Sejarah Organisasi**: Teks sejarah KPMBR-YK untuk halaman `/tentang`
2. **Foto Pelantikan**: Dokumentasi acara pelantikan 6 Juni 2026
3. **Program Kerja 2026/2027**: Daftar program kerja dengan divisi penanggung jawab
4. **Agenda 2026/2027**: Jadwal kegiatan yang sudah direncanakan

---

**Status**: ✅ Fase 1 (Audit & Persiapan) Selesai  
**Branch**: `data-asli-organisasi` (siap untuk di-push ke GitHub)

