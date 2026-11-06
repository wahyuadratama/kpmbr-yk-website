# Implementasi Cloudflare R2 — Dokumentasi Developer

## Overview

Integrasi Cloudflare R2 (S3-compatible object storage) untuk penyimpanan file website KPMBR-YK. Implementasi menggunakan adapter yang dapat fallback ke local storage jika R2 belum dikonfigurasi.

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│ Application (storeFile, readFile, deleteObject)             │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼─────┐          ┌───────▼──────┐
   │ R2 Adapter│          │ Local Storage│
   │ (r2.ts)   │          │ (.data/...)  │
   └────┬─────┘          └───────┬──────┘
        │                         │
   ┌────▼─────────────────────────▼──────┐
   │ Storage Backend (R2 atau Local)      │
   └──────────────────────────────────────┘
```

### Komponen

1. **`src/server/storage/index.ts`** — Interface publik
   - `storeFile()` — Upload file dengan validasi
   - `readFile()` — Download file
   - `deleteObject()` — Hapus file
   - `isStorageConfigured()` — Cek apakah R2 sudah dikonfigurasi

2. **`src/server/storage/r2.ts`** — Adapter R2
   - `uploadToR2()` — Upload ke R2
   - `downloadFromR2()` — Download dari R2
   - `deleteFromR2()` — Hapus dari R2
   - `isR2Configured()` — Cek konfigurasi

3. **Scripts**
   - `scripts/migrate-r2.ts` — Migrasi file lama ke R2
   - `scripts/verify-r2.ts` — Verifikasi konfigurasi R2

## Alur Kerja

### Upload File

```typescript
// Pemanggil tidak perlu tahu tentang R2
const result = await storeFile({
  data: buffer,
  declaredMime: "image/jpeg",
  declaredName: "photo.jpg",
  accessLevel: "PUBLIC",
  uploadedById: userId,
});
```

**Proses internal:**
1. Validasi MIME, ukuran, signature
2. Hitung checksum SHA256
3. Buat storage key: `YYYY/MM/UUID.ext`
4. Upload ke R2 (jika dikonfigurasi)
5. Fallback ke local storage jika R2 gagal
6. Catat metadata di database

### Download File

```typescript
// Pemanggil tidak perlu tahu tentang R2
const buffer = await readFile(storageKey);
```

**Proses internal:**
1. Cek apakah R2 dikonfigurasi
2. Coba download dari R2
3. Fallback ke local storage jika R2 gagal atau belum dikonfigurasi

### Hapus File

```typescript
// Pemanggil tidak perlu tahu tentang R2
await deleteObject(storageKey);
```

**Proses internal:**
1. Hapus dari R2 (jika dikonfigurasi)
2. Hapus dari local storage (jika ada)

## Konfigurasi

### Environment Variables

```env
R2_ACCOUNT_ID=<account-id>
R2_ACCESS_KEY_ID=<access-key>
R2_SECRET_ACCESS_KEY=<secret-key>
R2_BUCKET_NAME=kpmbr-yk-uploads
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

**Catatan:**
- Jika semua env vars kosong, fallback ke local storage
- `R2_PUBLIC_URL` adalah URL publik dari R2.dev subdomain atau custom domain (bukan endpoint S3 API)
- Jika `R2_PUBLIC_URL` kosong, file publik dilayani via `/api/public-files/<id>`

### Setup R2

Lihat `docs/SETUP-R2.md` untuk panduan lengkap.

## Scripts

### Verifikasi Konfigurasi

```bash
npm run verify:r2
```

Test upload, download, dan delete ke R2.

### Migrasi File Lama

```bash
npm run migrate:r2
```

Pindahkan semua file dari `.data/uploads/` ke R2. Proses:
1. Baca semua file dari database
2. Upload ke R2
3. Hapus file lokal setelah sukses

**Catatan:** Jangan hentikan sampai selesai.

## Fallback Behavior

Jika R2 gagal atau belum dikonfigurasi:

| Operasi | Behavior |
|---------|----------|
| Upload | Simpan ke local storage |
| Download | Baca dari local storage |
| Delete | Hapus dari local storage |

Ini memastikan aplikasi tetap berjalan di development tanpa R2.

## Keamanan

1. **Storage Key** — Dibangun dari UUID acak, bukan nama file kiriman
   - Mencegah path traversal
   - Mencegah file enumeration

2. **MIME Validation** — Validasi signature magic bytes
   - Mencegah upload file berbahaya dengan ekstensi palsu

3. **Access Control** — Metadata `accessLevel` di database
   - `PUBLIC` — Bisa diakses langsung via URL
   - `MEMBER_ONLY`, `PENGURUS_ONLY`, `ADMIN_ONLY` — Hanya via `/api/files/<id>` dengan otorisasi

4. **Checksum** — SHA256 untuk integritas file
   - Deteksi file corruption

## Performance

1. **R2 CDN** — File publik dilayani via CDN Cloudflare
   - Lebih cepat dari local storage
   - Bandwidth lebih efisien

2. **Lazy Loading** — File hanya didownload saat diakses
   - Tidak ada pre-caching

3. **Streaming** — Download besar tidak memuat seluruh file ke memory
   - Menggunakan stream dari AWS SDK

## Troubleshooting

### Error: "InvalidAccessKeyId"
- Pastikan `R2_ACCESS_KEY_ID` dan `R2_SECRET_ACCESS_KEY` benar
- Regenerate API token di Cloudflare Dashboard

### Error: "NoSuchBucket"
- Pastikan `R2_BUCKET_NAME` sesuai dengan nama bucket
- Pastikan bucket sudah dibuat di Cloudflare Dashboard

### Error: "AccessDenied"
- Pastikan API token memiliki permissions `Read`, `Write`, `Delete`
- Pastikan API token terbatas ke bucket yang benar

### File tidak bisa diakses via URL publik
- Pastikan `R2_PUBLIC_URL` sudah diisi
- Pastikan bucket memiliki **Public access** yang diizinkan
- Jika menggunakan custom domain, pastikan DNS sudah dikonfigurasi

## Testing

### Unit Test

```typescript
import { storeFile, readFile, deleteObject } from "@/server/storage";

describe("Storage", () => {
  it("should store and retrieve file", async () => {
    const data = Buffer.from("test");
    const result = await storeFile({
      data,
      declaredMime: "text/plain",
      declaredName: "test.txt",
      accessLevel: "PUBLIC",
      uploadedById: null,
    });

    const retrieved = await readFile(result.storageKey);
    expect(retrieved).toEqual(data);

    await deleteObject(result.storageKey);
  });
});
```

### Integration Test

```bash
npm run verify:r2
```

## Referensi

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
