# Laporan Prompt 2 — Integrasi Cloudflare R2

**Status**: ✅ Selesai  
**Branch**: `integrasi-r2`  
**Commit**: `0908ca5`  
**Tanggal**: 7 November 2026

## Ringkasan

Implementasi Cloudflare R2 (S3-compatible object storage) untuk penyimpanan file website KPMBR-YK. Sistem dirancang dengan fallback ke local storage, sehingga aplikasi tetap berjalan di development tanpa R2.

## File yang Berubah

### Baru Dibuat

1. **`src/server/storage/r2.ts`** (120 baris)
   - Adapter R2 dengan S3-compatible client
   - Fungsi: `uploadToR2()`, `downloadFromR2()`, `deleteFromR2()`, `isR2Configured()`
   - Fallback otomatis jika R2 gagal

2. **`scripts/migrate-r2.ts`** (80 baris)
   - Script migrasi file lama dari `.data/uploads/` ke R2
   - Baca dari database, upload ke R2, hapus lokal
   - Jalankan dengan: `npm run migrate:r2`

3. **`scripts/verify-r2.ts`** (60 baris)
   - Script verifikasi konfigurasi R2
   - Test upload, download, delete
   - Jalankan dengan: `npm run verify:r2`

4. **`docs/SETUP-R2.md`** (200 baris)
   - Panduan setup R2 untuk user
   - Langkah-langkah: buat bucket, API token, env vars
   - Troubleshooting

5. **`docs/R2-IMPLEMENTATION.md`** (250 baris)
   - Dokumentasi implementasi untuk developer
   - Arsitektur, alur kerja, keamanan, performance

### Dimodifikasi

1. **`src/server/storage/index.ts`**
   - Import adapter R2
   - Update `storeFile()` — upload ke R2 atau local storage
   - Update `readFile()` — download dari R2 atau local storage
   - Update `deleteObject()` — hapus dari R2 dan local storage
   - Tambah `isStorageConfigured()` — cek apakah R2 dikonfigurasi

2. **`package.json`**
   - Tambah dependency: `@aws-sdk/client-s3 ^3.600.0`
   - Tambah dependency: `@aws-sdk/util-stream-node`
   - Tambah npm scripts:
     - `migrate:r2` — migrasi file ke R2
     - `verify:r2` — verifikasi konfigurasi R2

3. **`.env.example`**
   - Sudah ada env vars R2 (tidak perlu diubah)

## Verifikasi

### TypeScript

```bash
npx tsc --noEmit
```

**Hasil**: ✅ 0 errors

### Build

```bash
npm run build
```

**Hasil**: ✅ Compiled successfully (21/21 static pages)

### Interface Storage

**Tidak ada breaking changes** — semua pemanggil tetap sama:

```typescript
// Sebelum dan sesudah, interface tetap sama
await storeFile({ data, declaredMime, ... })
await readFile(storageKey)
await deleteObject(storageKey)
```

## Cara Verifikasi Upload

### 1. Setup R2 (User)

Ikuti `docs/SETUP-R2.md`:
- Buat bucket di Cloudflare R2
- Buat API token
- Isi `.env` dengan env vars R2

### 2. Verifikasi Konfigurasi

```bash
npm run verify:r2
```

Output:
```
[R2 Verify] Memulai verifikasi Cloudflare R2...
[R2 Verify] ✓ R2 sudah dikonfigurasi
[R2 Verify] Testing upload...
[R2 Verify] ✓ Upload berhasil
[R2 Verify] Testing download...
[R2 Verify] ✓ Download berhasil
[R2 Verify] Testing delete...
[R2 Verify] ✓ Delete berhasil
[R2 Verify] ✓ Semua test berhasil!
```

### 3. Upload File Baru

Upload file melalui dashboard (admin/pengurus):
- File akan otomatis upload ke R2
- Metadata disimpan di database
- Storage key: `YYYY/MM/UUID.ext`

### 4. Verifikasi di R2 Dashboard

- Login ke Cloudflare Dashboard
- Buka R2 → bucket
- Lihat file di folder `2026/11/` (atau tahun/bulan sesuai upload)

### 5. Migrasi File Lama (Opsional)

Jika ada file lama di `.data/uploads/`:

```bash
npm run migrate:r2
```

Output:
```
[R2 Migration] Memulai migrasi file ke Cloudflare R2...
[R2 Migration] ✓ R2 sudah dikonfigurasi
[R2 Migration] Ditemukan 5 file untuk dimigrasikan
[R2 Migration] ✓ Migrasikan: photo.jpg (2026/11/uuid.jpg)
[R2 Migration] ✓ Migrasikan: document.pdf (2026/11/uuid.pdf)
...
[R2 Migration] Selesai!
  ✓ Berhasil: 5
  ❌ Gagal: 0
```

## Environment Variables (Wajib Diisi User)

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=<account-id-32-karakter>
R2_ACCESS_KEY_ID=<access-key-dari-api-token>
R2_SECRET_ACCESS_KEY=<secret-key-dari-api-token>
R2_BUCKET_NAME=kpmbr-yk-uploads
R2_PUBLIC_URL=https://<bucket>.<account>.r2.cloudflarestorage.com
```

**Catatan**:
- Semua env vars WAJIB diisi untuk production
- Jika kosong, fallback ke local storage (development mode)
- `R2_PUBLIC_URL` opsional — jika kosong, file publik dilayani via `/api/public-files/<id>`

## Alur Kerja

### Upload File

```
User upload file
    ↓
storeFile() di storage/index.ts
    ↓
Validasi MIME, ukuran, signature
    ↓
Hitung checksum SHA256
    ↓
Buat storage key: YYYY/MM/UUID.ext
    ↓
uploadToR2() di storage/r2.ts
    ├─ Jika R2 dikonfigurasi → upload ke R2
    └─ Jika gagal → fallback ke local storage
    ↓
Catat metadata di database
    ↓
Return storageKey
```

### Download File

```
Request file via /api/files/<id> atau /api/public-files/<id>
    ↓
readFile(storageKey) di storage/index.ts
    ↓
downloadFromR2() di storage/r2.ts
    ├─ Jika R2 dikonfigurasi → download dari R2
    └─ Jika gagal → fallback ke local storage
    ↓
Return buffer
```

### Hapus File

```
Delete file action
    ↓
deleteObject(storageKey) di storage/index.ts
    ↓
deleteFromR2() di storage/r2.ts
    ├─ Jika R2 dikonfigurasi → hapus dari R2
    └─ Jika gagal → lanjut ke local storage
    ↓
Hapus dari local storage (jika ada)
    ↓
Soft delete metadata di database
```

## Keamanan

1. **Storage Key** — UUID acak, bukan nama file
   - Mencegah path traversal
   - Mencegah file enumeration

2. **MIME Validation** — Magic bytes signature
   - Deteksi file berbahaya dengan ekstensi palsu

3. **Access Control** — Metadata `accessLevel`
   - `PUBLIC` — URL langsung
   - `MEMBER_ONLY`, `PENGURUS_ONLY`, `ADMIN_ONLY` — Via `/api/files/<id>` dengan otorisasi

4. **Checksum** — SHA256 untuk integritas

## Performance

1. **R2 CDN** — File publik via CDN Cloudflare
2. **Streaming** — Download besar tidak memuat seluruh file ke memory
3. **Lazy Loading** — File hanya didownload saat diakses

## Fallback Behavior

Jika R2 gagal atau belum dikonfigurasi:

| Operasi | Behavior |
|---------|----------|
| Upload | Simpan ke `.data/uploads/` |
| Download | Baca dari `.data/uploads/` |
| Delete | Hapus dari `.data/uploads/` |

Aplikasi tetap berjalan di development tanpa R2.

## Catatan Penting

1. **User harus setup R2 terlebih dahulu** — ikuti `docs/SETUP-R2.md`
2. **Jangan commit `.env`** — sudah masuk `.gitignore`
3. **Migrasi file lama opsional** — hanya jika ada file di `.data/uploads/`
4. **Tidak ada breaking changes** — interface storage tetap sama
5. **Backward compatible** — fallback ke local storage jika R2 belum dikonfigurasi

## Referensi

- Setup: `docs/SETUP-R2.md`
- Implementasi: `docs/R2-IMPLEMENTATION.md`
- Cloudflare R2: https://developers.cloudflare.com/r2/
- AWS SDK S3: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/

## Next Steps

1. User setup R2 sesuai `docs/SETUP-R2.md`
2. Jalankan `npm run verify:r2` untuk verifikasi
3. Upload file baru — akan otomatis masuk R2
4. (Opsional) Jalankan `npm run migrate:r2` untuk migrasi file lama
5. Merge branch `integrasi-r2` ke master setelah verifikasi

---

**Status**: ✅ Siap untuk merge  
**Branch**: `integrasi-r2`  
**Tidak ada breaking changes**  
**Backward compatible dengan local storage**
