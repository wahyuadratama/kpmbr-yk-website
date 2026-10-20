import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { requirePermissionPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { DashboardPagination } from "@/components/dashboard/pagination";
import { ConfirmActionForm } from "@/components/internal/confirm-action-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteAnnouncementFormAction,
} from "@/modules/announcements/form-actions";
import {
  deleteNewsFormAction,
  setNewsStatusFormAction,
} from "@/modules/news/form-actions";
import { formatTanggalPendek } from "@/lib/utils/format";
import { NewsStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Berita & Pengumuman" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

type Tab = "semua" | "berita" | "pengumuman" | "arsip";

const TABS: { key: Tab; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "berita", label: "Berita" },
  { key: "pengumuman", label: "Pengumuman" },
  { key: "arsip", label: "Arsip" },
];

const NEWS_TONE: Record<string, StatusTone> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
};

const AUDIENCE_TONE: Record<string, StatusTone> = {
  PUBLIC: "info",
  ANGGOTA: "brand",
  ALUMNI: "brand",
  PENGURUS: "warning",
};

const AUDIENCE_LABEL: Record<string, string> = {
  PUBLIC: "Publik",
  ANGGOTA: "Anggota",
  ALUMNI: "Alumni",
  PENGURUS: "Pengurus",
};

/**
 * CMS Berita & Pengumuman.
 *
 * Daftar, pencarian, filter, dan pagination berjalan di server lewat query
 * string, sehingga URL dapat dibagikan dan tidak memerlukan JavaScript.
 */
export default async function KontenPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; kategori?: string; status?: string; page?: string }>;
}) {
  const principal = await requirePermissionPage("news:read");
  const params = await searchParams;

  const canCreate = hasPermission(principal.role, "news:create");
  const canUpdate = hasPermission(principal.role, "news:update");
  const canDelete = hasPermission(principal.role, "news:delete");
  const canPublish = hasPermission(principal.role, "news:publish");

  const tab = (TABS.find((t) => t.key === params.tab)?.key ?? "semua") as Tab;
  const q = (params.q ?? "").trim();
  const kategori = params.kategori ?? "";
  const status = params.status ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const [categories, news, announcements] = await Promise.all([
    db.newsCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    db.news.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        authorName: true,
        category: { select: { id: true, name: true } },
      },
    }),
    db.announcement.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        body: true,
        priority: true,
        audience: true,
        createdAt: true,
        publishedAt: true,
      },
    }),
  ]);

  type Row = {
    kind: "berita" | "pengumuman";
    id: string;
    title: string;
    statusLabel: string;
    statusTone: StatusTone;
    category: string;
    author: string;
    date: Date;
    href: string;
  };

  const rows: Row[] = [];

  if (tab !== "pengumuman") {
    for (const item of news) {
      if (tab === "arsip" && item.status !== NewsStatus.ARCHIVED) continue;
      if (kategori && item.category?.id !== kategori) continue;
      if (status && item.status !== status) continue;
      if (q && !item.title.toLowerCase().includes(q.toLowerCase())) continue;
      rows.push({
        kind: "berita",
        id: item.id,
        title: item.title,
        statusLabel:
          item.status === NewsStatus.PUBLISHED
            ? "Terbit"
            : item.status === NewsStatus.DRAFT
              ? "Draf"
              : "Diarsipkan",
        statusTone: NEWS_TONE[item.status] ?? "neutral",
        category: item.category?.name ?? "Tanpa kategori",
        author: item.authorName,
        date: item.publishedAt ?? item.createdAt,
        href: `/admin/konten/berita/${item.id}`,
      });
    }
  }

  if (tab !== "berita" && tab !== "arsip") {
    for (const item of announcements) {
      if (q && !item.title.toLowerCase().includes(q.toLowerCase())) continue;
      rows.push({
        kind: "pengumuman",
        id: item.id,
        title: item.title,
        statusLabel: AUDIENCE_LABEL[item.audience] ?? item.audience,
        statusTone: AUDIENCE_TONE[item.audience] ?? "neutral",
        category: "Pengumuman",
        author: "Sekretariat",
        date: item.publishedAt,
        href: `/admin/konten/pengumuman/${item.id}`,
      });
    }
  }

  rows.sort((a, b) => b.date.getTime() - a.date.getTime());

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /** Bangun URL dengan filter yang sedang aktif. */
  const buildHref = (target: { page?: number; tab?: Tab } = {}) => {
    const query = new URLSearchParams();
    const nextTab = target.tab ?? tab;
    if (nextTab !== "semua") query.set("tab", nextTab);
    if (q) query.set("q", q);
    if (kategori) query.set("kategori", kategori);
    if (status) query.set("status", status);
    if (target.page && target.page > 1) query.set("page", String(target.page));
    const search = query.toString();
    return search ? `/admin/konten?${search}` : "/admin/konten";
  };

  return (
    <div className="space-y-5">
      <PageHeading
        title="Berita & Pengumuman"
        description="Kelola berita yang terbit di website dan pengumuman untuk anggota, alumni, serta publik."
        actions={
          canCreate ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/konten/pengumuman/baru">
                  <Megaphone aria-hidden="true" />
                  Buat Pengumuman
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/admin/konten/berita/baru">
                  <Plus aria-hidden="true" />
                  Tulis Berita
                </Link>
              </Button>
            </>
          ) : null
        }
      />

      {/* Tab */}
      <nav aria-label="Filter jenis konten">
        <ul className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <li key={item.key}>
              <Link
                href={buildHref({ tab: item.key, page: 1 })}
                aria-current={tab === item.key ? "page" : undefined}
                className={
                  tab === item.key
                    ? "inline-flex h-8 items-center rounded-lg bg-dashboard-primary px-3 text-xs font-medium text-white"
                    : "inline-flex h-8 items-center rounded-lg border border-dashboard-border bg-white px-3 text-xs font-medium text-dashboard-text-muted transition-colors hover:bg-dashboard-canvas"
                }
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Filter */}
      <Panel bodyClassName="p-4">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="tab" value={tab} />
          <div className="space-y-1.5">
            <Label htmlFor="q" className="text-xs">
              Cari judul
            </Label>
            <Input id="q" name="q" defaultValue={q} placeholder="Kata kunci" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kategori" className="text-xs">
              Kategori
            </Label>
            <select
              id="kategori"
              name="kategori"
              defaultValue={kategori}
              className="block h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs">
              Status
            </Label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="block h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Semua status</option>
              <option value={NewsStatus.DRAFT}>Draf</option>
              <option value={NewsStatus.PUBLISHED}>Terbit</option>
              <option value={NewsStatus.ARCHIVED}>Diarsipkan</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">
              Terapkan
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/konten">Reset</Link>
            </Button>
          </div>
        </form>
      </Panel>

      {/* Tabel */}
      <Panel bodyClassName="p-0">
        {visible.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            {q || kategori || status
              ? "Tidak ada konten yang cocok dengan filter yang dipilih."
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
            <TableBody>
              {visible.map((row) => (
                <TableRow key={`${row.kind}-${row.id}`}>
                  <TableCell className="max-w-[320px]">
                    <Link
                      href={row.href}
                      className="block truncate font-medium text-dashboard-text hover:text-dashboard-primary"
                    >
                      {row.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-dashboard-text-muted">
                      {row.kind === "berita" ? (
                        <Newspaper aria-hidden="true" className="size-3.5" />
                      ) : (
                        <Megaphone aria-hidden="true" className="size-3.5" />
                      )}
                      {row.kind === "berita" ? "Berita" : "Pengumuman"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-dashboard-text-muted">
                    {row.category}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-sm text-dashboard-text-muted">
                    {row.author}
                  </TableCell>
                  <TableCell className="text-sm text-dashboard-text-muted">
                    {formatTanggalPendek(row.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {row.kind === "berita" ? (
                        <>
                          {canUpdate ? (
                            <Button asChild variant="ghost" size="icon-sm">
                              <Link
                                href={row.href}
                                aria-label={`Sunting ${row.title}`}
                              >
                                <Pencil aria-hidden="true" />
                              </Link>
                            </Button>
                          ) : null}
                          {canUpdate && canPublish ? (
                            <ConfirmActionForm
                              action={setNewsStatusFormAction}
                              id={row.id}
                              fields={{
                                status:
                                  row.statusLabel === "Terbit"
                                    ? NewsStatus.ARCHIVED
                                    : NewsStatus.PUBLISHED,
                              }}
                              variant="outline"
                            >
                              {row.statusLabel === "Terbit" ? "Arsipkan" : "Terbitkan"}
                            </ConfirmActionForm>
                          ) : null}
                          {canDelete ? (
                            <ConfirmActionForm
                              action={deleteNewsFormAction}
                              id={row.id}
                              confirmMessage={`Hapus berita "${row.title}"?`}
                            >
                              <Trash2 aria-hidden="true" />
                            </ConfirmActionForm>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <Button asChild variant="ghost" size="icon-sm">
                            <Link
                              href={row.href}
                              aria-label={`Sunting ${row.title}`}
                            >
                              <Pencil aria-hidden="true" />
                            </Link>
                          </Button>
                          {canDelete ? (
                            <ConfirmActionForm
                              action={deleteAnnouncementFormAction}
                              id={row.id}
                              confirmMessage={`Hapus pengumuman "${row.title}"?`}
                            >
                              <Trash2 aria-hidden="true" />
                            </ConfirmActionForm>
                          ) : null}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <DashboardPagination
        page={safePage}
        pages={pages}
        total={total}
        size={PAGE_SIZE}
        buildHref={(target) => buildHref({ page: target })}
      />
    </div>
  );
}
