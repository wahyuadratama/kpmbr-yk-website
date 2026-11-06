import type { Metadata } from "next";
import Link from "next/link";
import { requirePermissionPage } from "@/server/auth/guards";
import { hasPermission } from "@/server/auth/permissions";
import { formatTanggalPendek, formatJam } from "@/shared/utils/format";
import { EmptyState } from "@/ui/components/ui/empty-state";
import { Filter, Inbox } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Label } from "@/ui/components/ui/label";
import { AuditAction } from "@/generated/prisma/enums";
import { db } from "@/server/db/prisma";

export const metadata: Metadata = { title: "Log Audit" };
export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Buat",
  UPDATE: "Ubah",
  DELETE: "Hapus",
  RESTORE: "Kembalikan",
  LOGIN: "Masuk",
  LOGIN_FAILED: "Gagal Masuk",
  LOGOUT: "Keluar",
  PASSWORD_CHANGE: "Ubah Kata Sandi",
  ROLE_CHANGE: "Ubah Peran",
  VIEW_SENSITIVE: "Lihat Sensitif",
  EXPORT: "Ekspor",
  UPLOAD: "Unggah",
  DOWNLOAD: "Unduh",
};

type AuditFilters = {
  actor?: string | null;
  action?: string | null;
  resource?: string | null;
  from?: string | null;
  to?: string | null;
  q?: string | null;
  page?: string | null;
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<AuditFilters>;
}) {
  const principal = await requirePermissionPage("audit_log:read");
  const params = await searchParams;

  const actorFilter = params.actor ?? "";
  const actionFilter = params.action ?? "";
  const resourceFilter = params.resource ?? "";
  const fromFilter = params.from ?? "";
  const toFilter = params.to ?? "";
  const qFilter = params.q ?? "";

  const page = Math.max(1, Number(params.page) || 1);
  const size = 25;
  const skip = (page - 1) * size;

  const where: Record<string, unknown> = {};

  if (actorFilter) {
    where.actorId = actorFilter;
  }
  if (actionFilter) {
    where.action = actionFilter as AuditAction;
  }
  if (resourceFilter) {
    where.resource = resourceFilter;
  }
  if (fromFilter) {
    where.createdAt = { ...(where.createdAt as object), gte: new Date(fromFilter) };
  }
  if (toFilter) {
    // Batas "sampai tanggal" mencakup sepanjang hari tersebut, bukan hanya
    // tengah malam. Tanpa ini, catatan pada tanggal yang sama ikut terbuang.
    const endOfDay = new Date(toFilter);
    endOfDay.setHours(23, 59, 59, 999);
    where.createdAt = { ...(where.createdAt as object), lte: endOfDay };
  }
  if (qFilter) {
    where.OR = [
      { resource: { contains: qFilter } },
      { resourceId: { contains: qFilter } },
      { actor: { email: { contains: qFilter } } },
    ];
  }

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        createdAt: true,
        ipAddress: true,
        actor: { select: { id: true, email: true, role: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  const pages = Math.ceil(total / size);
  const canRead = hasPermission(principal.role, "audit_log:read");

  /** Bangun URL halaman lain dengan filter yang sedang aktif. */
  const pageUrl = (target: number) => {
    const query = new URLSearchParams();
    if (actorFilter) query.set("actor", actorFilter);
    if (actionFilter) query.set("action", actionFilter);
    if (resourceFilter) query.set("resource", resourceFilter);
    if (fromFilter) query.set("from", fromFilter);
    if (toFilter) query.set("to", toFilter);
    if (qFilter) query.set("q", qFilter);
    if (target > 1) query.set("page", String(target));
    const search = query.toString();
    return search ? `/admin/audit-log?${search}` : "/admin/audit-log";
  };

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Log Audit</h1>
        <p className="text-sm text-muted-foreground">
          Jejak semua mutasi dan aksi sensitif di sistem. Append-only, tidak
          dapat diubah atau dihapus.
        </p>
      </section>

      {!canRead ? (
        <EmptyState
          icon={Filter}
          title="Tidak ada akses ke log audit"
          description="Peran Anda tidak memiliki izin membaca log audit."
        />
      ) : (
        <>
          <section className="space-y-4">
            {/*
              Filter memakai form GET sehingga penyaringan berjalan tanpa
              JavaScript dan URL hasil filter dapat dibagikan.
            */}
            <form
              method="get"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="actor" className="text-xs uppercase tracking-wide">
                  Aktor
                </Label>
                <input
                  id="actor"
                  name="actor"
                  defaultValue={actorFilter}
                  className="block h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action" className="text-xs uppercase tracking-wide">
                  Aksi
                </Label>
                <select
                  id="action"
                  name="action"
                  defaultValue={actionFilter}
                  className="block h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Semua aksi</option>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource" className="text-xs uppercase tracking-wide">
                  Resource
                </Label>
                <input
                  id="resource"
                  name="resource"
                  defaultValue={resourceFilter}
                  className="block h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  placeholder="Mis. News, File"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from" className="text-xs uppercase tracking-wide">
                  Dari tanggal
                </Label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={fromFilter}
                  className="block h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to" className="text-xs uppercase tracking-wide">
                  Sampai tanggal
                </Label>
                <input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={toFilter}
                  className="block h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q" className="text-xs uppercase tracking-wide">
                  Cari
                </Label>
                <input
                  id="q"
                  name="q"
                  defaultValue={qFilter}
                  className="block h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  placeholder="Resource, ID, atau email aktor"
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-6">
                <Button type="submit">Terapkan</Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/audit-log">Reset</Link>
                </Button>
              </div>
            </form>
          </section>

          {items.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Belum ada catatan audit"
              description={
                actorFilter || actionFilter || resourceFilter || qFilter || fromFilter || toFilter
                  ? "Tidak ada catatan yang cocok dengan filter yang dipilih."
                  : "Belum ada aktivitas yang tercatat."
              }
            />
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Waktu</th>
                      <th className="p-3 text-left">Aktor</th>
                      <th className="p-3 text-left">Peran</th>
                      <th className="p-3 text-left">Aksi</th>
                      <th className="p-3 text-left">Resource</th>
                      <th className="p-3 text-left">ID Resource</th>
                      <th className="p-3 text-left">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((log) => (
                      <tr key={log.id} className="p-3">
                        <td className="text-muted-foreground text-sm">
                          {formatTanggalPendek(log.createdAt)} {formatJam(log.createdAt)}
                        </td>
                        <td className="font-medium text-sm">
                          {log.actor?.email ?? "—"}
                        </td>
                        <td className="text-muted-foreground text-xs">
                          {log.actor?.role ?? "—"}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                              log.action === "DELETE"
                                ? "border-destructive/20 bg-destructive/50 text-destructive"
                                : log.action === "LOGIN_FAILED"
                                  ? "border-amber/20 bg-amber/50 text-amber-700"
                                  : "border-slate/20 bg-slate/50 text-slate-700"
                            }`}
                          >
                            {ACTION_LABELS[log.action] ?? log.action}
                          </span>
                        </td>
                        <td className="text-muted-foreground text-sm">
                          {log.resource}
                        </td>
                        <td className="text-muted-foreground text-sm">
                          {log.resourceId ?? "—"}
                        </td>
                        <td className="text-muted-foreground text-xs">
                          {log.ipAddress ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p>
                  Menampilkan {items.length} dari {total} catatan
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={pageUrl(page - 1)}>Sebelumnya</Link>
                    </Button>
                  )}
                  <span className="px-2">
                    Halaman {page} dari {pages}
                  </span>
                  {page < pages && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={pageUrl(page + 1)}>Berikutnya</Link>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
