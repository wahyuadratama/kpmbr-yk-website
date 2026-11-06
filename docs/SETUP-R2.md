# Setup Cloudflare R2 untuk KPMBR-YK

Panduan lengkap untuk mengintegrasikan Cloudflare R2 sebagai penyimpanan file website KPMBR-YK.

## Prasyarat

- Akun Cloudflare (gratis atau berbayar)
- Akses ke Cloudflare Dashboard

## Langkah 1: Buat Bucket R2

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pilih **R2** di sidebar kiri
3. Klik **Create bucket**
4. Isi nama bucket: `kpmbr-yk-uploads` (atau nama lain sesuai preferensi)
5. Pilih lokasi geografis (default: automatic)
6. Klik **Create bucket**

## Langkah 2: Buat API Token R2

1. Di Cloudflare Dashboard, buka **R2** → pilih bucket yang baru dibuat
2. Klik tab **Settings**
3. Scroll ke bagian **API tokens**
4. Klik **Create API token**
5. Isi form:
   - **Token name**: `kpmbr-yk-api` (atau nama deskriptif lainnya)
   - **Permissions**: Pilih **Object-level permissions**
     - Izinkan: `Read`, `Write`, `Delete`
     - Bucket: Pilih bucket yang baru dibuat
   - **TTL**: Biarkan kosong (tidak ada expiry) atau sesuaikan
6. Klik **Create API token**
7. **PENTING**: Copy dan simpan token yang ditampilkan — hanya ditampilkan sekali!

## Langkah 3: Dapatkan Account ID

1. Di Cloudflare Dashboard, buka **R2** → **Settings**
2. Cari bagian **Account details**
3. Copy **Account ID** (format: 32 karakter hex)

## Langkah 4: Dapatkan Public URL (Opsional)

Jika ingin file dapat diakses langsung via URL publik (tanpa melalui server):

1. Di Cloudflare Dashboard, buka **R2** → pilih bucket
2. Klik tab **Settings**
3. Scroll ke **Public access**
4. Klik **Allow access** (jika belum diizinkan)
5. Copy **Public URL** (format: `https://<bucket-name>.<account-id>.r2.cloudflarestorage.com`)

Atau gunakan custom domain:
1. Di tab **Settings**, cari **Custom domain**
2. Klik **Connect domain**
3. Ikuti instruksi untuk menghubungkan domain Anda

## Langkah 5: Isi Environment Variables

Buka file `.env` di root project dan tambahkan:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=<account-id-dari-langkah-3>
R2_ACCESS_KEY_ID=<access-key-dari-api-token>
R2_SECRET_ACCESS_KEY=<secret-key-dari-api-token>
R2_BUCKET_NAME=kpmbr-yk-uploads
R2_PUBLIC_URL=https://<bucket-name>.<account-id>.r2.cloudflarestorage.com
```

**Catatan**:
- `R2_ACCESS_KEY_ID` dan `R2_SECRET_ACCESS_KEY` adalah bagian dari API token yang dibuat di Langkah 2
- `R2_PUBLIC_URL` opsional — jika kosong, file publik akan dilayani via `/api/public-files/<id>`
- **JANGAN** commit `.env` ke git — sudah masuk `.gitignore`

## Langkah 6: Verifikasi Konfigurasi

Jalankan script verifikasi:

```bash
npm run db:smoke
```

Script ini akan mengecek:
- Koneksi ke R2 berhasil
- Bucket dapat diakses
- Permissions API token sudah benar

## Troubleshooting

### Error: "InvalidAccessKeyId"
- Pastikan `R2_ACCESS_KEY_ID` dan `R2_SECRET_ACCESS_KEY` benar
- Regenerate API token jika perlu

### Error: "NoSuchBucket"
- Pastikan `R2_BUCKET_NAME` sesuai dengan nama bucket yang dibuat
- Pastikan bucket sudah dibuat di Cloudflare Dashboard

### Error: "AccessDenied"
- Pastikan API token memiliki permissions `Read`, `Write`, `Delete`
- Pastikan API token terbatas ke bucket yang benar

### File tidak bisa diakses via URL publik
- Pastikan `R2_PUBLIC_URL` sudah diisi dengan benar
- Pastikan bucket memiliki **Public access** yang diizinkan
- Jika menggunakan custom domain, pastikan DNS sudah dikonfigurasi

## Migrasi File Lama

Setelah konfigurasi R2 selesai, jalankan script migrasi untuk memindahkan file lama dari `.data/uploads/` ke R2:

```bash
npm run migrate:r2
```

Script ini akan:
1. Membaca semua file dari `.data/uploads/`
2. Upload ke R2 dengan storage key yang sama
3. Update metadata di database
4. Hapus file lokal setelah sukses

**Catatan**: Proses ini bisa memakan waktu tergantung jumlah file. Jangan hentikan sampai selesai.

## Setelah Setup Selesai

1. Upload file baru akan otomatis masuk ke R2
2. File lama tetap bisa diakses (sudah dimigrasikan)
3. Folder `.data/uploads/` bisa dihapus (atau dibiarkan kosong untuk backup)
4. Tidak ada perubahan di kode aplikasi — interface storage tetap sama

## Referensi

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
