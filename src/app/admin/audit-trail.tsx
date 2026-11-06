import { db } from "@/server/db/prisma";
import { formatTanggalPendek, formatJam } from "@/shared/utils/format";
import { emptyStateText } from "./empty-audit";

/**
 * Jejak audit terbaru.
 *
 * Hanya `ADMIN` yang punya `audit_log:read`; pemanggil sudah dijaga oleh
 * layout `/admin` dan guard `requirePermissionPage`.
 */
export async function AuditTrail() {
  const rows = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      actorId: true,
      createdAt: true,
      metadata: true,
    },
  });

  if (rows.length === 0) return emptyStateText("Belum ada aktivitas tercatat.");

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Jejak audit (20 terbaru)</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">Waktu</th>
              <th className="p-2">Aksi</th>
              <th className="p-2">Resource</th>
              <th className="p-2">Actor</th>
              <th className="p-2">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="p-2 whitespace-nowrap">
                  {formatTanggalPendek(row.createdAt)} {formatJam(row.createdAt)}
                </td>
                <td className="p-2">
                  <span className="rounded border px-1.5 py-0.5 text-xs">{row.action}</span>
                </td>
                <td className="p-2">
                  {row.resource}
                  {row.resourceId ? (
                    <span className="ml-1 text-xs text-muted-foreground">{row.resourceId}</span>
                  ) : null}
                </td>
                <td className="p-2 text-xs">{row.actorId ?? "-"}</td>
                <td className="p-2 text-xs text-muted-foreground">
                  {row.metadata ? JSON.stringify(row.metadata).slice(0, 120) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}