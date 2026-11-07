# LAPORAN PROMPT 3 — Transisi Membership + Notifikasi In-App

Branch: `membership-notifikasi` (dari `master` 31416ca). **Tidak merge.**

## Temuan skema awal (sebelum diubah)

- **Model `Notification`**: **tidak ada** di `prisma/schema.prisma` (AGENTS.md menyebut "model DB sudah ada, UI belum" — ternyata belum ada; dibuat di Prompt 3).
- **Membership** (`model Membership`): field `status MembershipStatus @default(PENDAFTARAN)`, `cohort`, `startDate`, `endDate?`, `endReason?`, `notes?`. Riwayat tidak pernah dihapus.
- **Enum `MembershipStatus`**: `PENDAFTARAN, AKTIF, LULUS, KELUAR, DINONAKTIFKAN` (nilai `LULUS` sudah ada).
- **Enum `MembershipEndReason`**: `LULUS, PINDAH_INSTITUSI, PINDAH_KOTA, MENUNJUK_PENGURUS, LAINNYA`.
- **Role user**: `ADMIN, PENGURUS, BENDAHARA, ANGGOTA, ALUMNI` (di `User.role`).
- **Transisi lama** (`src/server/actions/alumni.ts`): satu langkah langsung AKTIF → LULUS + ubah role ALUMNI + set `graduationYear`, audit `ROLE_CHANGE` pada resource `Member`. Tidak ada notifikasi, tidak menonaktifkan kartu. UI: `src/ui/components/alumni/transisi-form.tsx` dipakai di `/admin/alumni`. `/admin/anggota` read-only, tanpa aksi.
- **Pola kode**: Server Actions pakai `runAction` (`src/server/actions/result.ts`) + `requirePermission`/`requireSession` (`src/server/auth/guards.ts`, role dibaca ulang dari DB). Audit via `writeAudit` (`src/server/audit.ts`, append-only, redaksi field sensitif). Modul contoh `src/server/modules/announcements/{actions,form-actions,queries}.ts` (`"server-only"`, Zod, `db.$transaction`, audit, cache tag). Dashboard internal pakai `DashboardShell` (`src/ui/components/dashboard/dashboard-shell.tsx`) dengan slot `headerActions`.

## Fitur yang diimplementasikan

### 1) Skema & migrasi (lokal)
- `prisma/schema.prisma`: tambah `enum NotificationType { MEMBERSHIP_TRANSITION, PENGUMUMAN, SYSTEM }`, `model Notification` (id, userId FK→users cascade, type, title, body, link?, isRead default false, createdAt; index `[userId,isRead,createdAt]`, `[userId,createdAt]`), relasi `User.notifications`.
- Migrasi manual (karena `prisma migrate dev --create-only` non-interaktif di lingkungan ini): `prisma/migrations/20261022000000_add_notifications/migration.sql`.
- SQL diaplikasikan ke DB dev lokal via script Node (`mysql2`, koneksi localhost) → tabel `notifications` dibuat; `prisma migrate resolve --applied 20261022000000_add_notifications`; `prisma generate`. **Tidak menyentuh DB selain dev lokal.**

### 2) Transisi membership (AKTIF → LULUS → ALUMNI)
- Aturan (default wajar, konfirmasi pengurus di Prompt 4):
  - Manual oleh role dengan permission `member:change_status` (ADMIN, PENGURUS) lewat CMS. Bukan otomatis tanggal.
  - Alur ketat: `AKTIF → LULUS` (aksi `MARK_LULUS`, wajib `graduationYear`; update membership → `LULUS`, set `endDate/endReason/notes`, update `Member.graduationYear`) lalu `LULUS → ALUMNI` (aksi `MARK_ALUMNI`; update `User.role=ALUMNI`, **nonaktifkan semua `DigitalMemberCard` aktif** milik member: `isActive=false, revokedAt, revokedById`).
  - Tolak loncat/mundur/transisi ilegal dengan error jelas. Validasi alur server-side.
  - Setiap transisi **wajib** audit log: `AuditAction.ROLE_CHANGE`, metadata `{memberId, memberCode, userId, transition, graduationYear/endReason/notes, roleBefore/After, cardsRevoked}`. Riwayat membership tidak pernah dihapus.
  - Setelah transisi: trigger notifikasi ke member + semua ADMIN aktif (lihat bagian notifikasi).
- File kunci:
  - `src/server/actions/alumni.ts` — action 2 langkah + validasi alur + kartu dinonaktifkan + audit + trigger notif.
  - `src/ui/components/admin/member-transition-actions.tsx` — aksi per baris (Tandai Lulus/Jadikan Alumni) dengan konfirmasi `window.confirm`, input tahun lulus, refresh setelah sukses.
  - `src/app/admin/anggota/page.tsx` — daftar anggota + **filter status** (`?status=`: AKTIF/LULUS/PENDAFTARAN/KELUAR/DINONAKTIFKAN/ALUMNI role) + kolom status/role + aksi transisi per baris.
  - `src/ui/components/alumni/transisi-form.tsx`, `src/app/admin/alumni/page.tsx` — form transisi manual diperbarui mengikuti action baru (pilih aksi AKTIF→LULUS / LULUS→ALUMNI).

### 3) Notifikasi in-app
- Model/helper: `src/server/modules/notifications/create.ts` (`createNotification` non-blocking, `notifyUserAndAdmins`, `notifyAnnouncementPublished` ke semua user aktif via `createMany`), `queries.ts` (list per userId sesi, unread count), `actions.ts` (`markNotificationReadAction`, `markAllNotificationsReadAction`, ownership via `userId` sesi).
- Trigger minimal:
  - **Transisi membership** (`alumni.ts`): notif ke member bersangkutan + notif ke semua ADMIN aktif (`MEMBERSHIP_TRANSITION`), link ke portal member/alumni atau admin.
  - **Pengumuman baru diterbitkan** (`src/server/modules/announcements/actions.ts` → `createAnnouncementAction`): notif ke **semua user aktif** (semua role, `UserStatus.ACTIVE`, tidak dihapus) — pilihan ini memastikan anggota/alumni/pengurus/bendahara/admin semua tahu; dicatat untuk konfirmasi pengurus.
- API (auth wajib, data difilter server-side by `principal.userId`):
  - `GET /api/notifications?page=&size=` → `{items,total,unreadCount,...}` terbaru dulu.
  - `POST /api/notifications/[id]/read` → tandai satu (milik sendiri).
  - `POST /api/notifications/read-all` → tandai semua.
- UI: `src/ui/components/dashboard/notification-bell.tsx` (client, lonceng + badge unread, dropdown 8 terbaru, tandai satu/semua, link tujuan, polling 60s; gagal fetch diam). Diintegrasikan ke header `DashboardShell` → otomatis tampil di **semua portal** (admin, pengurus, bendahara, member, alumni) yang memakai `DashboardShell`. Mengikuti design system existing (DropdownMenu/Button/lucide). In-app saja, tidak ada email/WA.

## Keputusan yang perlu konfirmasi pengurus (untuk Prompt 4)
1. **Siapa boleh transisi**: diimplementasikan untuk role dengan `member:change_status` (ADMIN & PENGURUS). Perubahan `User.role→ALUMNI` adalah konsekuensi alur; konfirmasi apakah PENGURUS boleh, atau khusus ADMIN.
2. **Target notif pengumuman**: saat ini ke semua user aktif (semua role). Konfirmasi apakah perlu difilter by `AnnouncementAudience`/role, atau cukup broadcast in-app.
3. **Transisi manual vs otomatis tanggal lulus**: saat ini manual CMS (sesuai default).
4. **Kartu anggota** saat LULUS (sebelum ALUMNI): saat ini kartu baru dinonaktifkan saat langkah `LULUS→ALUMNI`. Konfirmasi apakah perlu dinonaktifkan lebih awal.
5. **Notifikasi gagal (non-blocking)**: kegagalan kirim notif tidak menggagalkan transisi/publikasi (dicatat log). Konfirmasi perilaku ini.

## Hasil gate verifikasi

| Gate | Hasil |
|---|---|
| `npx tsc --noEmit` | **HIJAU** (exit 0) |
| `npm run build` | **HIJAU** (Next.js build sukses; TypeScript selesai) |
| `npm run db:smoke` | **HIJAU** (8/8 checks passed, termasuk koneksi, relasi, enum, soft delete, rollback) |
| `npm run test:auth` | **HIJAU** (**105 lulus, 0 gagal**) — RBAC/auth/lockout/rate-limit/redirect/audit/permission matrix tetap lolos |
| `npm run verify:r2` | **HIJAU** (upload/download/delete R2 sukses) |

## Hasil uji manual alur (kode/pola) — perlu dijalankan di app berjalan

> Lingkungan CLI ini menjalankan gate non-interaktif; alur UI manual di bawah **diimplementasikan** dan siap diuji pada app dev lokal (`npm run dev`, DB lokal). Langkah verifikasi yang disiapkan:

1. **Transisi AKTIF → LULUS → ALUMNI via CMS**: `/admin/anggota` → pada member berstatus AKTIF klik `Tandai Lulus` (isi tahun, konfirmasi) → status jadi LULUS + audit `ROLE_CHANGE` resource `Membership` (transition `AKTIF->LULUS`) + notif ke member & admin. Lalu `Jadikan Alumni` pada member LULUS → `User.role` jadi ALUMNI, kartu aktif dinonaktifkan, audit `Member` transition `LULUS->ALUMNI`, notif terkirim. Buka lonceng di akun member/admin → notifikasi muncul → tandai dibaca (satu/semua) → badge berkurang. (Bisa juga via `/admin/alumni` form manual.)
2. **Transisi ilegal ditolak**: coba `ALUMNI → AKTIF` / loncat / ulang via action (form pilih aksi tidak sesuai status, atau panggil action dengan status salah) → server melempar error jelas (`Transisi ilegal... Status saat ini: ...`), ditampilkan di UI; tidak ada perubahan data.
3. **Tanpa hak ditolak**: user ANGGOTA biasa memanggil action/API transisi → `requirePermission("member:change_status")` / guard menolak (403/UNAUTHORIZED sesuai jalur) — konsisten dengan matrix (PENGURUS/ADMIN saja punya `member:change_status`; 105 assertion auth tetap hijau).

## Hasil push + nama branch (inti Prompt 3)
- Branch **`membership-notifikasi`** (dari `master` 31416ca). Commit inti: `1767bc8` — `Prompt 3: Transisi membership ANGGOTA-LULUS-ALUMNI + notifikasi in-app`. Push berhasil ke `origin/membership-notifikasi`. **Tidak merge, tidak buat PR.**

---

## FASE 1B — Lengkapi Data Anggota (pengajuan self-service + persetujuan sekretariat)

> Ditambahkan di branch yang sama (`membership-notifikasi`) di atas Prompt 3 inti. **Tidak mengulang/mengubah kode transisi membership + notifikasi inti** kecuali trigger notif yang memang dipakai ulang (modul `notifications/create.ts` yang sudah ada).

### Desain alur pengajuan + status yang dipakai

**Keputusan (wajib dipatuhi):** pendaftaran anggota **manual** — form self-service **TIDAK** membuat member AKTIF; pengesahan tetap sekretariat/admin.

- **Skema (paling konsisten):** model terpisah `MemberApplication` + `enum MemberApplicationStatus { PENDING, APPROVED, REJECTED }` (bukan status PENDING di `Member`, karena akun belum terhubung → belum ada baris `Member`/`memberships` sampai disetujui). Menyimpan snapshot data (fullName, nickname, gender, phone, city, bio, addressDetail), `rejectionNote`, `reviewedBy/At`. Boleh riwayat banyak baris per user, tapi **hanya 1 PENDING pada satu waktu** (dicegah server-side + cek query).
- **Alur akun belum terhubung** (`/member/profil`, `principal.memberId` null): ganti "Hubungi sekretariat" → form **"Lengkapi Data Anggota"** (pakai ulang field ProfileForm sebisa mungkin). Submit → simpan pengajuan **PENDING** (akun tetap belum terhubung). Jika sudah ada PENDING → tampilkan **status pengajuan** (bukan form baru). Jika REJECTED → tampilkan alasan + **boleh ajukan ulang**.
- **Persetujuan CMS (sekretariat/admin, `member:create`)** `/admin/anggota/pengajuan`: daftar pending + riwayat diproses. **Setujui** → dalam transaksi: generate `memberCode` pola `KPMBR-YK-{YYYY}-{0000}` (urut naik per tahun, konsisten; pola sebelumnya di kode hanya muncul di docs, seed pakai kode BPH/DIVISI), buat `Member` (hubungkan `userId`) + `Membership` **AKTIF** (cohort tahun berjalan), tandai pengajuan `APPROVED`, audit `CREATE Member` (metadata `fromApplicationId`), notif member disetujui (link `/member/profil`). **Tolak** → `REJECTED` + alasan/catatan, audit `UPDATE MemberApplication`, notif member ditolak (boleh ajukan ulang). Pengajuan ganda PENDING dicegah; submit saat sudah terhubung ditolak.
- **Validasi server (Zod):** `memberApplicationSchema` (fullName wajib, format HP `/^[0-9+\-\s()]*$/`, batas panjang) — `src/shared/validation/member.ts`. Tidak percaya input klien. Aksi pakai `runAction` + guard + `writeAudit`.
- **Notifikasi (pakai sistem Prompt 3):** submit → notif ke semua user aktif role **ADMIN & PENGURUS** (`SYSTEM`, link `/admin/anggota/pengajuan`). Setujui/Tolak → notif ke member pemohon.

### File kunci yang diubah/dibuat (FASE 1B)
- Skema/migrasi (DB dev lokal): `prisma/schema.prisma` (+`MemberApplicationStatus`, `MemberApplication`, relasi `User.memberApplications/memberApplicationReviews`), `prisma/migrations/20261022010000_add_member_applications/migration.sql` (applied lokal; resolved), `prisma generate`.
- Server: `src/server/actions/member-application.ts` (submit/approve/reject, cegah ganda, memberCode, transaksi, audit, notif). `src/shared/validation/member.ts` (+`memberApplicationSchema`, regex HP).
- UI member: `src/ui/components/member/member-application-form.tsx`, `src/app/member/profil/page.tsx` (form/status pengajuan/pending/rejected+ajukan ulang vs ProfileForm bila terhubung).
- UI CMS: `src/app/admin/anggota/pengajuan/page.tsx` (daftar pending/riwayat), `src/ui/components/admin/member-application-actions.tsx` (setujui/tolak+alasan), `src/app/admin/anggota/page.tsx` (+link "Pengajuan Masuk").
- Uji manual (beneran): `scripts/test-member-application-logic.js` (transaksi+ROLLBACK, DB lokal). Helper migrasi lokal: `scripts/{write-member-application-migration,apply-member-application-migration,apply-fase1b,probe-db,check-fase1b,ensure-fase1b-tables,check-tables,apply-notif-migration}.js`.

### Hasil gate verifikasi (FASE 1B)

| Gate | Hasil |
|---|---|
| `npx tsc --noEmit` | **HIJAU** (exit 0) |
| `npm run build` | **HIJAU** (Next.js build sukses; route `/admin/anggota/pengajuan`, `/member/profil` terbangun) |
| `npm run db:smoke` | **HIJAU** (8/8 passed) |
| `npm run test:auth` | **HIJAU** (**105 lulus, 0 gagal**) — RBAC/auth/lockout/rate-limit/redirect/audit/matrix tetap lolos |
| `npm run verify:r2` | **HIJAU** (upload/download/delete OK) |

### Hasil uji manual alur (dijalankan beneran, DB lokal — bukan "perlu dijalankan")

Skrip `scripts/test-member-application-logic.js` (koneksi DB lokal, transaksi + **ROLLBACK** → DB bersih): **10 lulus, 0 gagal**.
- Akun uji belum terhubung → submit → pengajuan **PENDING** tersimpan, akun **masih belum terhubung** (member tidak dibuat); profil menampilkan status pengajuan (bukan form edit penuh) — diverifikasi oleh kondisi/logic.
- **Cegah pengajuan ganda**: ada PENDING → dicegah dengan pesan jelas (`Anda sudah memiliki pengajuan...`).
- **Setujui** (logika approve): akun **terhubung**, `Member` + `Membership` **AKTIF**, **memberCode** terisi (`KPMBR-YK-2026-0001`), pengajuan **APPROVED**; notif disetujui diterima member (alur notif via modul Prompt 3).
- **Tolak**: status **REJECTED** + alasan tersimpan, notif penolakan; **akun boleh mengajukan ulang** (tanpa PENDING) → pengajuan baru PENDING tersimpan.
- **Submit saat sudah terhubung** → ditolak (`Akun Anda sudah terhubung ke data anggota.`).
