import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { formatTanggalPendek, formatJam } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/empty-state";
import { Filter, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuditAction } from "@/generated/prisma/enums";
import { db } from "@/lib/db/prisma";

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
  searchParams: AuditFilters;
}) {
  const principal = await requirePermissionPage("audit_log:read");

  const actorFilter = searchParams.actor ?? "";
  const actionFilter = searchParams.action ?? "";
  const resourceFilter = searchParams.resource ?? "";
  const fromFilter = searchParams.from ?? "";
  const toFilter = searchParams.to ?? "";
  const qFilter = searchParams.q ?? "";

  const page = Math.max(1, Number(searchParams.page) || 1);
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
    where.createdAt = { ...(where.createdAt as object), lte: new Date(toFilter) };
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
            <form
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const url = new URL(window.location.href);
                url.searchParams.set("actor", String(fd.get("actor") ?? ""));
                url.searchParams.set("action", String(fd.get("action") ?? ""));
                url.searchParams.set("resource", String(fd.get("resource") ?? ""));
                url.searchParams.set("from", String(fd.get("from") ?? ""));
                url.searchParams.set("to", String(fd.get("to") ?? ""));
                url.searchParams.set("q", String(fd.get("q") ?? ""));
                url.searchParams.set("page", "1");
                window.location.href = url.toString();
              }}
            >
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide">Aktor</Label>
                <input
                  name="actor"
                  defaultValue={actorFilter}
                  className="block w-full border rounded-lg px-3 py-2 text-sm bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide">Aksi</Label>
                <select
                  name="action"
                  defaultValue={actionFilter}
                  className="block w-full border rounded-lg px-3 py-2 text-sm bg-input"
                >
                  <option value="">Semua aksi</option>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <option key={value} value={value} selected={actionFilter === value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide">Resource</Label>
                <input
                  name="resource"
                  defaultValue={resourceFilter}
                  className="block w-full border rounded-lg px-3 py-2 text-sm bg-input"
                  placeholder="Mis. News, File"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide">Dari tanggal</Label>
                <input
                  name="from"
                  type="date"
                  defaultValue={fromFilter}
                  className="block w-full border rounded-lg px-3 py-2 text-sm bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide">Sampai tanggal</Label>
                <input
                  name="to"
                  type="date"
                  defaultValue={toFilter}
                  className="block w-full border rounded-lg px-3 py-2 text-sm bg-input"
                />
              </div>
              <div className="space-y-2 flex items-end">
                <Button type="submit">Terapkan</Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = window.location.pathname;
                  }}
                >
                  Reset
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide">Cari</Label>
                <input
                  name="q"
                  defaultValue={qFilter}
                  className="block w-full border rounded-lg px-3 py-2 text-sm bg-input"
                  placeholder="Resource, ID, atau email aktor"
                />
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("page", String(page - 1));
                        window.location.href = url.toString();
                      }}
                    >
                      Sebelumnya
                    </Button>
                  )}
                  <span className="px-2">
                    Halaman {page} dari {pages}
                  </span>
                  {page < pages && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("page", String(page + 1));
                        window.location.href = url.toString();
                      }}
                    >
                      Selanjutnya
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
