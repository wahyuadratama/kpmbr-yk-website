import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { requirePermissionPage } from "@/server/auth/guards";
import { hasPermission } from "@/server/auth/permissions";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import { StatusBadge } from "@/ui/components/dashboard/status-badge";
import { DashboardPagination } from "@/ui/components/dashboard/pagination";
import { ConfirmActionForm } from "@/ui/components/internal/confirm-action-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/ui/table";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import {
  CONTENT_KINDS,
  listAllContent,
  type ContentKind,
  type ContentRow,
} from "@/server/modules/content/queries";
import { deleteAnnouncementFormAction } from "@/server/modules/announcements/form-actions";
import { deleteNewsFormAction, setNewsStatusFormAction } from "@/server/modules/news/form-actions";
import { deleteProgramFormAction } from "@/server/modules/programs/form-actions";
import { deleteEventFormAction } from "@/server/modules/events/form-actions";
import { deleteDocumentationAlbumFormAction } from "@/server/modules/documentation/form-actions";
import { formatTanggalPendek } from "@/shared/utils/format";
import { NewsStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Semua Konten" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

const KIND_ICON: Record<ContentKind, typeof Newspaper> = {
  berita: Newspaper,
  pengumuman: Megaphone,
  proker: Newspaper,
  agenda: Newspaper,
  dokumentasi: Newspaper,
};

const KIND_LABEL: Record<ContentKind, string> = {
  berita: "Berita",
  pengumuman: "Pengumuman",
  proker: "Program Kerja",
  agenda: "Agenda",
  dokumentasi: "Dokumentasi",
};

/** Aksi hapus untuk tiap jenis konten — memakai aksi modul masing-masing. */
const DELETE_ACTION: Record<
  ContentKind,
  (formData: FormData) => void | Promise<void>
> = {
  berita: deleteNewsFormAction,
  pengumuman: deleteAnnouncementFormAction,
  proker: deleteProgramFormAction,
  agenda: deleteEventFormAction,
  dokumentasi: deleteDocumentationAlbumFormAction,
};

/**
 * Halaman "Semua Konten" — daftar terpadu seluruh konten publik.
 *
 * Tab memfilter jenis konten, pencarian memfilter judul, dan keduanya berjalan
 * di server lewat query string.
 */
export default async function KontenPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const principal = await requirePermissionPage("news:read");
  const params = await searchParams;

  const canCreate = hasPermission(principal.role, "news:create");
  const canCreateAnnouncement = hasPermission(principal.role, "announcement:create");
  const canUpdate = hasPermission(principal.role, "news:update");
  const canDelete = hasPermission(principal.role, "news:delete");

  const activeKind = CONTENT_KINDS.find((item) => item.key === params.tab)?.key ?? null;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, pages } = await listAllContent({
    kind: activeKind,
    q,
    page,
    size: PAGE_SIZE,
  });

  const buildHref = (target: { tab?: string | null; page?: number } = {}) => {
    const query = new URLSearchParams();
    const nextTab = target.tab === undefined ? activeKind : target.tab;
    if (nextTab) query.set("tab", nextTab);
    if (q) query.set("q", q);
    if (target.page && target.page > 1) query.set("page", String(target.page));
    const search = query.toString();
    return search ? `/admin/konten?${search}` : "/admin/konten";
  };

  const renderRow = (row: ContentRow) => {
    const Icon = KIND_ICON[row.kind];
    return (
      <TableRow key={`${row.kind}-${row.id}`}>
        <TableCell className="max-w-[320px]">
          {row.editHref ? (
            <Link
              href={row.editHref}
              className="block truncate font-medium text-dashboard-text hover:text-dashboard-primary"
            >
              {row.title}
            </Link>
          ) : (
            <span className="block truncate font-medium text-dashboard-text">
              {row.title}
            </span>
          )}
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1.5 text-xs text-dashboard-text-muted">
            <Icon aria-hidden="true" className="size-3.5" />
            {KIND_LABEL[row.kind]}
          </span>
        </TableCell>
        <TableCell className="max-w-[200px] truncate text-sm text-dashboard-text-muted">
          {row.subtitle}
        </TableCell>
        <TableCell>
          <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
        </TableCell>
        <TableCell className="max-w-[200px] truncate text-sm text-dashboard-text-muted">
          {row.author}
        </TableCell>
        <TableCell className="text-sm text-dashboard-text-muted">
          {formatTanggalPendek(row.date)}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            {row.editHref ? (
              <Button asChild variant="ghost" size="icon-sm">
                <Link href={row.editHref} aria-label={`Sunting ${row.title}`}>
                  <Pencil aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
            {row.kind === "berita" && canUpdate ? (
              <ConfirmActionForm
                action={setNewsStatusFormAction}
                id={row.id}
                fields={{
                  status:
                    row.status === "Terbit"
                      ? NewsStatus.ARCHIVED
                      : NewsStatus.PUBLISHED,
                }}
                variant="outline"
              >
                {row.status === "Terbit" ? "Arsipkan" : "Terbitkan"}
              </ConfirmActionForm>
            ) : null}
            {canDelete ? (
              <ConfirmActionForm
                action={DELETE_ACTION[row.kind]}
                id={row.id}
                confirmMessage={`Hapus ${KIND_LABEL[row.kind].toLowerCase()} "${row.title}"?`}
              >
                <Trash2 aria-hidden="true" />
              </ConfirmActionForm>
            ) : null}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeading
        title="Semua Konten"
        description="Kelola seluruh konten publik website: berita, pengumuman, program kerja, agenda, dan dokumentasi."
        actions={
          <>
            {canCreateAnnouncement ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/konten/pengumuman/baru">
                  <Plus aria-hidden="true" />
                  Buat Pengumuman
                </Link>
              </Button>
            ) : null}
            {canCreate ? (
              <Button asChild size="sm">
                <Link href="/admin/konten/berita/baru">
                  <Plus aria-hidden="true" />
                  Tulis Berita
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <nav aria-label="Saring konten berdasarkan jenis">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={buildHref({ tab: null, page: 1 })}
              aria-current={activeKind === null ? "true" : undefined}
              className={
                activeKind === null
                  ? "inline-flex h-8 items-center rounded-lg bg-dashboard-primary px-3 text-xs font-medium text-white"
                  : "inline-flex h-8 items-center rounded-lg border border-dashboard-border bg-white px-3 text-xs font-medium text-dashboard-text-muted transition-colors hover:bg-dashboard-canvas"
              }
            >
              Semua
            </Link>
          </li>
          {CONTENT_KINDS.map((kind) => {
            const isActive = activeKind === kind.key;
            return (
              <li key={kind.key}>
                <Link
                  href={buildHref({ tab: kind.key, page: 1 })}
                  aria-current={isActive ? "true" : undefined}
                  className={
                    isActive
                      ? "inline-flex h-8 items-center rounded-lg bg-dashboard-primary px-3 text-xs font-medium text-white"
                      : "inline-flex h-8 items-center rounded-lg border border-dashboard-border bg-white px-3 text-xs font-medium text-dashboard-text-muted transition-colors hover:bg-dashboard-canvas"
                  }
                >
                  {kind.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Panel bodyClassName="p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          {activeKind ? <input type="hidden" name="tab" value={activeKind} /> : null}
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label htmlFor="q" className="text-xs">
              Cari judul
            </Label>
            <Input id="q" name="q" defaultValue={q} placeholder="Kata kunci" />
          </div>
          <Button type="submit" size="sm">
            Terapkan
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/konten">Reset</Link>
          </Button>
        </form>
      </Panel>

      <Panel bodyClassName="p-0">
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            {q
              ? "Tidak ada konten yang cocok dengan pencarian."
              : "Belum ada konten. Mulai dengan menulis berita."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Penulis</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{items.map(renderRow)}</TableBody>
          </Table>
        )}
      </Panel>

      <DashboardPagination
        page={page}
        pages={pages}
        total={total}
        size={PAGE_SIZE}
        buildHref={(target) => buildHref({ page: target })}
      />
    </div>
  );
}
