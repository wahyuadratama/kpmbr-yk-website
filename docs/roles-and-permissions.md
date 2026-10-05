# Roles & Permissions — KPMBR-YK

Empat peran. Satu sistem autentikasi. Otorisasi **selalu** ditegakkan di
server.

## 1. Peran

| Peran    | Deskripsi                                                        |
| -------- | --------------------------------------------------------------- |
| ADMIN    | Administrator sistem. Akses penuh, termasuk keuangan & audit log  |
| PENGURUS | Pengurus. Akses sesuai tanggung jawab                             |
| ANGGOTA  | Anggota aktif. Akses baca konten + kelola profil sendiri         |
| ALUMNI   | Lulusan anggota. Akses direktori alumni + konten alumni           |

Sumber nilai role: `users.role` (enum di Prisma). Nilai ini **tidak pernah**
diambil dari form, query string, header, atau body request.

## 2. Permission

Permission adalah Capability, bukan role. Role → permission dipetakan di
satu tempat (`src/lib/auth/permissions.ts` pada tahap 2) supaya daftar ini
dapat diuji dan diaudit.

Format permission: `<resource>:<action>`, dengan action dari
`create | read | update | delete | approve | export`.

## 3. Matrix Permission

| Permission                  | ADMIN | PENGURUS | ANGGOTA | ALUMNI |
| --------------------------- | :---: | :------: | :-----: | :----: |
| `user:read`                |  ✅   |    ❌    |   ❌    |   ❌   |
| `user:create`              |  ✅   |    ❌    |   ❌    |   ❌   |
| `user:update`              |  ✅   |    ❌    |   ❌    |   ❌   |
| `user:delete`              |  ✅   |    ❌    |   ❌    |   ❌   |
| `user:change_role`         |  ✅   |    ❌    |   ❌    |   ❌   |
| `member:read`              |  ✅   |   ※¹    |   ❌    |   ❌   |
| `member:create`            |  ✅   |   ※¹    |   ❌    |   ❌   |
| `member:update`            |  ✅   |   ※¹    |  ※²    |   ❌   |
| `member:delete`            |  ✅   |    ❌    |   ❌    |   ❌   |
| `member:change_status`     |  ✅   |   ※¹    |   ❌    |   ❌   |
| `alumni:read_directory`    |  ✅   |   ※¹    |  ※³    |   ✅   |
| `alumni:read_contact`      |  ✅   |   ※¹    |   ❌    |   ❌   |
| `news:read`                |  ✅   |   ✅    |   ✅    |   ✅   |
| `news:create`              |  ✅   |   ✅    |   ❌    |   ❌   |
| `news:update`              |  ✅   |   ✅    |   ❌    |   ❌   |
| `news:delete`              |  ✅   |   ※¹    |   ❌    |   ❌   |
| `news:publish`             |  ✅   |   ✅    |   ❌    |   ❌   |
| `program:read`             |  ✅   |   ✅    |   ✅    |   ✅   |
| `program:create`           |  ✅   |   ✅    |   ❌    |   ❌   |
| `program:update`           |  ✅   |   ✅    |   ❌    |   ❌   |
| `program:delete`           |  ✅   |   ※¹    |   ❌    |   ❌   |
| `event:read`               |  ✅   |   ✅    |   ✅    |   ✅   |
| `event:create`             |  ✅   |   ✅    |   ❌    |   ❌   |
| `event:update`             |  ✅   |   ✅    |   ❌    |   ❌   |
| `event:delete`             |  ✅   |   ※¹    |   ❌    |   ❌   |
| `documentation:read`       |  ✅   |   ✅    |   ✅    |   ✅   |
| `documentation:create`     |  ✅   |   ✅    |   ❌    |   ❌   |
| `documentation:delete`     |  ✅   |   ※¹    |   ❌    |   ❌   |
| `announcement:read`        |  ✅   |   ✅    |   ✅    |   ✅   |
| `announcement:create`      |  ✅   |   ✅    |   ❌    |   ❌   |
| `announcement:delete`      |  ✅   |   ※¹    |   ❌    |   ❌   |
| `finance:read_summary`     |  ✅   |   ✅    |  ※⁴    |   ❌   |
| `finance:read_transaction` |  ✅   |   ✅    |   ❌    |   ❌   |
| `finance:create`           |  ✅   |   ※¹    |   ❌    |   ❌   |
| `finance:delete`           |  ✅   |    ❌    |   ❌    |   ❌   |
| `finance:export`           |  ✅   |   ※¹    |   ❌    |   ❌   |
| `document:read`            |  ✅   |   ✅    |  ※⁵    |  ※⁵   |
| `document:create`          |  ✅   |   ✅    |   ❌    |   ❌   |
| `document:delete`          |  ✅   |    ❌    |   ❌    |   ❌   |
| `file:upload`              |  ✅   |   ✅    |  ※²    |  ※²   |
| `card:read_own`            |  ✅   |   ✅    |   ✅    |   ❌   |
| `card:read_any`            |  ✅   |   ※¹    |   ❌    |   ❌   |
| `audit_log:read`           |  ✅   |    ❌    |   ❌    |   ❌   |

Catatan:

- ※¹ **TIDAK default penuh.** Permission PENGURUS diberikan secara eksplisit
  per tanggung jawab, bukan "semua yang ada". Contoh: `news:delete` dan
  `finance:create` tidak diberikan ke PENGURUS secara default karena
  bersifat destruktif.
- ※² Anggota hanya untuk **data sendiri** (own resource). Verifikasi
  kepemilikan dilakukan di server, bukan dari parameter `memberId` milik
  klien.
- ※³ Anggota boleh melihat direktori alumni dengan data minimal, hanya bila
  anggota tersebut juga mencentang visibility. **REQUIRES DECISION** —
  lihat `architecture.md` §8.3.
- ※⁴ Ringkasan keuangan untuk anggota hanya bisa ditampilkan bila
  organisasi memang menerbitkannya. **REQUIRES DECISION** — lihat
  `architecture.md` §8.4.
- ※⁵ Bergantung pada `files.access_level` dokumen, bukan role semata.

## 4. Aturan Wajib

### 4.1 Otorisasi di Server

```text
Frontend
   ↓  (form submit / fetch)
Server Action atau Route Handler
   ↓
Authentication   — session valid? ambil userId dari session
   ↓
Authorization    — role → permission, plus cek kepemilikan resource
   ↓
Validation      — Zod, server-side
   ↓
Database
```

Contoh salah:

```text
Frontend:
if (role === "ADMIN") showDeleteButton()
```

Lalu route handler API tidak memeriksa role. Ini adalah celah.

Contoh benar:

```ts
// src/modules/news/server/actions.ts
export async function deleteNews(id: string) {
  const session = await requireSession();              // authentication
  if (!can(session.user.role, "news:delete")) {          // authorization
    await recordAudit(session.user.id, "DELETE", "News", id);
    throw new ForbiddenError();
  }
  // ... validasi + hapus
}
```

### 4.2 Role Tidak Pernah Dipercayai dari Klien

- Body request: abaikan `role` dari client.
- Query string: abaikan `?role=ADMIN`.
- Header kustom: abaikan.
- Session: satu-satunya sumber role adalah `users.role` yang dibaca di
  server pada saat request (bukan dari klaim token yang tidak bisa
  dicabut).

### 4.3 Resource Ownership

Sebelum update/delete, cek bahwa record milik caller:

```text
ANGGOTA hanya boleh update Member dengan id = session.memberId
```

Pemeriksaan dilakukan di query (filter `where`), bukan setelahnya:

```ts
await db.member.updateMany({
  where: { id: input.memberId, userId: session.user.id },
  data: { ... },
});
```

`updateMany` mengembalikan jumlah baris. Jika `0`, berarti tidak boleh.

### 4.4 Sesi Dicabut Saat Role Berubah

Sesi disimpan di database (`sessions`), bukan JWT stateless. Keuntungan:

- Admin dapat mencabut sesi secara instan.
- Perubahan role berlaku pada request berikutnya.
- Logout di semua perangkat.

## 5. Akses File

`files.access_level` menentukan siapa boleh mengunduh.

| Access level     | Siapa boleh akses                                     |
| ---------------- | ---------------------------------------------------- |
| `PUBLIC`         | Semua, termasuk pengunjung                          |
| `MEMBER_ONLY`    | ADMIN, PENGURUS, ANGGOTA                            |
| `PENGURUS_ONLY`  | ADMIN, PENGURUS                                      |
| `ADMIN_ONLY`     | ADMIN                                               |

Aturan tambahan:

- **URL alone tidak cukup.** File privat tidak pernah dilayani langsung
  dari URL publik R2. Akses lewat route server yang memeriksa session +
  access level, dan mencatat `AuditAction.DOWNLOAD`.
- Aset `PUBLIC` (foto kegiatan, avatar yang disetujui) boleh dilayani dari
  `R2_PUBLIC_URL` untuk hemat biaya.
- Penentuan access level saat upload hanya oleh ADMIN atau PENGURUS yang
  memiliki `document:create`. Anggota tidak boleh meng-upload file dengan
  access level apa pun kecuali avatar sendiri (dibatasi).

## 6. Status Akun

| Status      | Login | Akses portal |
| ----------- | :---: | :----------: |
| `PENDING`   |  ❌   |      ❌      |
| `ACTIVE`    |  ✅   |      ✅      |
| `SUSPENDED` |  ❌   |      ❌      |
| `ARCHIVED`  |  ❌   |      ❌      |

Menonaktifkan akun **tidak** menghapus riwayat keanggotaan, jabatan, atau
audit log.

## 7. Status Keanggotaan

```text
PENDAFTARAN ──→ AKTIF ──→ LULUS  (menjadi alumni)
                  │
                  ├──→ KELUAR
                  └──→ DINONAKTIFKAN
```

- `LULUS` → pengguna dapat login dengan role `ALUMNI`.
- `KELUAR` / `DINONAKTIFKAN` → akses baca konten anggota dicabut, riwayat
  tetap tersimpan.
- `MembershipEndReason` mencatat alasan agar transisi dapat diaudit.
