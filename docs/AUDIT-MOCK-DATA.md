# Audit MockDataNotice — Halaman Publik KPMBR-YK

**Tanggal Audit**: 7 November 2026  
**Total Halaman dengan MockDataNotice**: 12 halaman  
**Sumber Data Utama**: `docs/data-kpmbr-pelantikan-2026-2027.md` (Berkas Pelantikan KPMBR 2026/2027, 6 Juni 2026)

---

## Daftar Halaman & Data Mock

### 1. **Homepage** (`src/app/(public)/page.tsx`)
- **Scope MockDataNotice**: "ringkasan aktivitas di homepage"
- **Data Mock yang Dipakai**:
  - Statistik organisasi (jumlah anggota, program aktif, agenda, album)
  - Berita terbaru (featured + 3 berita lain)
  - Agenda terdekat (3 event)
  - Program kerja (3 program)
  - Album dokumentasi (3 album)
- **Status**: Sebagian besar data sudah dari database (queries), tapi statistik masih mock
- **Sumber Data Asli**: Database (sudah ada query)
- **TODO**: Pastikan statistik terisi dari data real

---

### 2. **Tentang KPMBR-YK** (`src/app/(public)/tentang/page.tsx`)
- **Scope MockDataNotice**: "seluruh isi halaman ini"
- **Data Mock yang Dipakai**:
  - Sejarah organisasi (paragraf)
  - Visi
  - Misi (daftar)
  - Nilai organisasi (title + description)
  - Identitas organisasi (nama, sebutan, wilayah, sekretariat, kontak)
  - Kepengurusan (jabatan inti + divisi)
- **Status**: Semua dari database queries
- **Sumber Data Asli**: 
  - Visi/Misi/Nilai: Database (sudah ada)
  - Kepengurusan: Database (sudah ada)
  - Sejarah: **TODO** — belum ada di berkas referensi
  - Identitas: `siteConfig` (sudah ada)
- **TODO**: Ekstrak sejarah dari sumber lain atau minta ke pengurus

---

### 3. **Kepengurusan** (`src/app/(public)/kepengurusan/page.tsx`)
- **Scope MockDataNotice**: "nama pemegang jabatan dan periode"
- **Data Mock yang Dipakai**:
  - Daftar jabatan inti (BPH) dengan nama pemegang
  - Divisi (4 divisi)
  - Periode kepengurusan (riwayat)
- **Status**: Dari database queries
- **Sumber Data Asli**: 
  - **BPH**: `data-kpmbr-pelantikan-2026-2027.md` ✓
    - Ketua: Syachril Gunawan (Nata Prawira XX)
    - Wakil Ketua: Muhammad Bilal Ardiansyah
    - Sekretaris 1: Zaenal Wahyudin
    - Bendahara 1: Nur Shabrina Widjani Balqis
  - **Divisi**: `data-kpmbr-pelantikan-2026-2027.md` ✓
    - PSDM (Ketua: Rizal Mustofa)
    - HUMAS (Ketua: Zahra Aulia Putri)
    - MEDIA & EKRAF (Ketua: Fajar Rasyid Al Maula)
    - OLAHRAGA (Ketua: Safa Andani Hermawan)
- **TODO**: Seed data BPH + divisi ke database

---

### 4. **Kepengurusan — Detail Periode** (`src/app/(public)/kepengurusan/[periode]/page.tsx`)
- **Scope MockDataNotice**: Tidak ada (halaman ini tidak pakai MockDataNotice)
- **Data Mock yang Dipakai**: Riwayat jabatan per periode
- **Status**: Dari database queries
- **Sumber Data Asli**: Database (sudah ada struktur)
- **TODO**: Pastikan data periode 2026/2027 sudah di-seed

---

### 5. **Berita** (`src/app/(public)/berita/page.tsx`)
- **Scope MockDataNotice**: "seluruh berita"
- **Data Mock yang Dipakai**:
  - Daftar berita (featured + list)
  - Kategori berita
- **Status**: Dari database queries
- **Sumber Data Asli**: Database (sudah ada struktur)
- **TODO**: Seed berita pelantikan 6 Juni 2026 (serah terima Ramdan → Syachril)

---

### 6. **Dokumentasi** (`src/app/(public)/dokumentasi/page.tsx`)
- **Scope MockDataNotice**: "seluruh album dan jumlah foto"
- **Data Mock yang Dipakai**:
  - Daftar album dokumentasi
  - Jumlah foto per album
- **Status**: Dari database queries
- **Sumber Data Asli**: Database (sudah ada struktur)
- **TODO**: Seed album pelantikan 6 Juni 2026 (FOTO belum ada di berkas — minta ke pengurus)

---

### 7. **Dokumentasi — Detail Album** (`src/app/(public)/dokumentasi/[slug]/page.tsx`)
- **Scope MockDataNotice**: "isi album ini"
- **Data Mock yang Dipakai**:
  - Detail album (judul, deskripsi, tanggal, jumlah foto)
  - Daftar foto (placeholder, belum ada R2)
- **Status**: Dari database queries
- **Sumber Data Asli**: Database (sudah ada struktur)
- **TODO**: Upload foto pelantikan setelah R2 terpasang

---

### 8. **Agenda** (`src/app/(public)/agenda/page.tsx`)
- **Scope MockDataNotice**: "seluruh agenda"
- **Data Mock yang Dipakai**:
  - Agenda mendatang
  - Agenda telah berlangsung
- **Status**: Dari database queries
- **Sumber Data Asli**: Database (sudah ada struktur)
- **TODO**: Seed agenda pelantikan 6 Juni 2026 (sudah berlangsung)

---

### 9. **Keanggotaan** (`src/app/(public)/keanggotaan/page.tsx`)
- **Scope MockDataNotice**: "syarat, manfaat, dan alur pendaftaran"
- **Data Mock yang Dipakai**:
  - Persyaratan keanggotaan
  - Manfaat menjadi anggota
  - Alur pendaftaran (5 langkah)
- **Status**: Dari database queries
- **Sumber Data Asli**: Database (sudah ada struktur)
- **TODO**: Pastikan data sudah sesuai dengan AD/ART KPMBR-YK

---

### 10. **Program Kerja** (`src/app/(public)/proker/page.tsx`)
- **Scope MockDataNotice**: "seluruh program kerja"
- **Data Mock yang Dipakai**:
  - Daftar program kerja
  - Status program (DIRANCANG, BERJALAN, SELESAI, DIBATALKAN)
- **Status**: Dari database queries
- **Sumber Data Asli**: Database (sudah ada struktur)
- **TODO**: Seed program kerja periode 2026/2027

---

### 11. **Kontak** (`src/app/(public)/kontak/page.tsx`)
- **Scope MockDataNotice**: "alamat sekretariat dan tautan sosial"
- **Data Mock yang Dipakai**:
  - Email sekretariat
  - Instagram (@kpmbr)
  - Alamat sekretariat
- **Status**: Dari `siteConfig`
- **Sumber Data Asli**: `src/shared/site-config.ts` (sudah ada)
- **TODO**: Verifikasi data di siteConfig sudah benar

---

### 12. **Homepage — Statistik** (bagian dari halaman 1)
- **Scope MockDataNotice**: Sudah tercakup di halaman 1
- **Data Mock yang Dipakai**: Statistik organisasi
- **Status**: Dari database queries
- **Sumber Data Asli**: Database
- **TODO**: Pastikan statistik terisi dari data real

---

## Ringkasan Data Asli yang Tersedia

### ✅ Data Terverifikasi dari Berkas Pelantikan (6 Juni 2026)

| Kategori | Data | Status |
|----------|------|--------|
| **Identitas Organisasi** | Nama: KPMBR-YK, Kabinet: Sabilulungan, Periode: 2026/2027 | ✅ Siap seed |
| **BPH** | Ketua: Syachril Gunawan (Nata Prawira XX), Wakil Ketua: Muhammad Bilal Ardiansyah, Sekretaris 1: Zaenal Wahyudin, Bendahara 1: Nur Shabrina Widjani Balqis | ✅ Siap seed |
| **Divisi** | PSDM (Rizal Mustofa), HUMAS (Zahra Aulia Putri), MEDIA & EKRAF (Fajar Rasyid Al Maula), OLAHRAGA (Safa Andani Hermawan) | ✅ Siap seed |
| **Anggota Divisi** | 16 nama anggota (4 divisi × 4 anggota) | ✅ Siap seed |
| **Ikrar Pengurus** | 3 poin ikrar | ✅ Siap seed |
| **Serah Terima** | Ketua sebelumnya: M. Ramdan Irawan (Nata Prawira XIX), Ketua baru: Syachril Gunawan (Nata Prawira XX) | ✅ Siap seed |
| **Sesepuh Adat** | Raden Wadana Dipawangsayuda / Ki Demang Wangsafyudin, S.H. | ✅ Siap seed |
| **Gelar Adat** | Nata Prawira XX (untuk Syachril Gunawan) | ✅ Siap seed |
| **Wilayah Asal** | Kabupaten Bandung, Kota Bandung, Kota Cimahi, Kabupaten Bandung Barat | ✅ Siap seed |

### ❌ Data yang BELUM Ada / TODO

| Kategori | Data | Sumber | Status |
|----------|------|--------|--------|
| **Sejarah Organisasi** | Paragraf sejarah KPMBR-YK | Belum ada di berkas | 🔴 TODO: Minta ke pengurus |
| **Foto Pelantikan** | Dokumentasi acara pelantikan 6 Juni 2026 | Belum ada di berkas | 🔴 TODO: Minta ke pengurus |
| **Visi/Misi/Nilai** | Sudah ada di database | Database | ✅ Sudah ada |
| **Persyaratan Keanggotaan** | Sudah ada di database | Database | ✅ Sudah ada |
| **Manfaat Keanggotaan** | Sudah ada di database | Database | ✅ Sudah ada |
| **Alur Pendaftaran** | Sudah ada di database | Database | ✅ Sudah ada |
| **Program Kerja 2026/2027** | Daftar program kerja | Belum ada | 🔴 TODO: Minta ke pengurus |
| **Agenda 2026/2027** | Jadwal kegiatan | Belum ada | 🔴 TODO: Minta ke pengurus |

---

## Rencana Implementasi

### Fase 1: Seed Data Terverifikasi (dari Berkas Pelantikan)
1. Seed BPH + divisi + anggota divisi ke database
2. Seed berita pelantikan (serah terima Ramdan → Syachril)
3. Seed agenda pelantikan (6 Juni 2026)
4. Seed ikrar pengurus + sesepuh adat + gelar adat

### Fase 2: Hapus MockDataNotice (Halaman yang Sudah Asli)
- Halaman yang sudah punya data asli: Kepengurusan, Berita, Dokumentasi, Agenda, Keanggotaan, Program Kerja, Kontak
- Halaman yang masih perlu data: Tentang (sejarah), Homepage (statistik)

### Fase 3: Tunggu Data Tambahan dari Pengurus
- Sejarah organisasi
- Foto pelantikan
- Program kerja 2026/2027
- Agenda 2026/2027

---

## Catatan Penting

- **Aturan Keras**: DILARANG mengarang data organisasi. Data yang tidak terverifikasi ditulis sebagai TODO, bukan diisi asal-asalan.
- **Jalur Seeding**: Semua data masuk lewat database (Prisma seed script), bukan hardcode di komponen.
- **Editabilitas**: Semua data yang di-seed HARUS bisa diedit admin lewat CMS sesudahnya.
- **MockDataNotice**: Hanya dihapus di halaman yang datanya sudah asli. Halaman yang datanya belum ada tetap tampil mock + notice.

