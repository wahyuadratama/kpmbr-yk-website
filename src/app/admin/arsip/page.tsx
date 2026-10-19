import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { formatTanggalPendek } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/empty-state";
import { Filter, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { listOrganizationDocuments } from "@/modules/organization-documents/queries";
import { deleteOrganizationDocumentFormAction } from "@/modules/organization-documents/actions";
import { ArsipUploadForm } from "@/components/admin/arsip-upload-form";
import {
  DocumentCategory,
  FileAccessLevel,
} from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Arsip Dokumen" };
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  LPJ: "LPJ",
  PROPOSAL: "Proposal",
  SK: "SK",
  NOTULEN: "Notulen",
  AD_ART: "AD/ART",
  LAINNYA: "Lainnya",
};

const ACCESS_LABELS: Record<string, string> = {
  PUBLIC: "Publik",
  MEMBER_ONLY: "Anggota",
  PENGURUS_ONLY: "Pengurus",
  ADMIN_ONLY: "Admin",
};

export default async function ArsipPage({
  searchParams,
}: {
  searchParams: { category?: string; accessLevel?: string };
}) {
  const principal = await requirePortalPage("/admin");

  const canRead = hasPermission(principal.role, "document:read");
  const canDelete = hasPermission(principal.role, "document:delete");

  const categoryFilter = searchParams.category;
  const accessLevelFilter = searchParams.accessLevel;

  const documents = canRead
    ? await listOrganizationDocuments({
        size: 50,
        category: categoryFilter as DocumentCategory,
        accessLevel: accessLevelFilter as FileAccessLevel,
      })
    : { items: [], total: 0 };

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Arsip Dokumen</h1>
        <p className="text-sm text-muted-foreground">
          Arsip dokumen organisasi: LPJ, proposal, SK, notulen, AD/ART.
        </p>
      </section>

      {!canRead ? (
        <EmptyState
          icon={Filter}
          title="Tidak ada akses ke arsip dokumen"
          description="Peran Anda tidak memiliki izin membaca dokumen arsip."
        />
      ) : (
        <>
          <section className="space-y-4">
            <ArsipUploadForm />

            <div className="flex flex-wrap gap-4 items-end">
              <form className="flex flex-wrap gap-2 items-end">
                <Label className="text-xs uppercase tracking-wide w-full sm:w-auto">
                  Filter kategori
                </Label>
                <select
                  name="category"
                  defaultValue={categoryFilter ?? ""}
                  onChange={(e) => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("category", e.target.value);
                    window.location.href = url.toString();
                  }}
                  className="border rounded-lg px-3 py-2 text-sm bg-input"
                >
                  <option value="">Semua</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value} selected={categoryFilter === value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  name="accessLevel"
                  defaultValue={accessLevelFilter ?? ""}
                  onChange={(e) => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("accessLevel", e.target.value);
                    window.location.href = url.toString();
                  }}
                  className="border rounded-lg px-3 py-2 text-sm bg-input"
                >
                  <option value="">Semua akses</option>
                  {Object.entries(ACCESS_LABELS).map(([value, label]) => (
                    <option
                      key={value}
                      value={value}
                      selected={accessLevelFilter === value}
                    >
                      {label}
                    </option>
                  ))}
                </select>
                <Button type="submit" className="ml-2">
                  Terapkan
                </Button>
              </form>
              {documents.total > 0 && (
                <p className="text-xs text-muted-foreground">
                  {documents.total} dokumen
                </p>
              )}
            </div>
          </section>

          {documents.items.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Belum ada dokumen arsip"
              description={
                categoryFilter || accessLevelFilter
                  ? "Tidak ada dokumen yang cocok dengan filter yang dipilih."
                  : "Mulai unggah dokumen arsip organisasi."
              }
            />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Judul</th>
                    <th className="p-3 text-left">Kategori</th>
                    <th className="p-3 text-left">Akses</th>
                    <th className="p-3 text-left">File</th>
                    <th className="p-3 text-left">Dibuat oleh</th>
                    <th className="p-3 text-left">Tanggal</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {documents.items.map((doc) => (
                    <tr key={doc.id} className="p-3">
                      <td className="font-medium">{doc.title}</td>
                      <td className="text-muted-foreground text-sm">
                        {CATEGORY_LABELS[doc.category] ?? doc.category}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                            doc.accessLevel === "PUBLIC"
                              ? "border-emerald/20 bg-emerald/50 text-emerald-700"
                              : doc.accessLevel === "MEMBER_ONLY"
                              ? "border-slate/20 bg-slate/50 text-slate-700"
                              : doc.accessLevel === "PENGURUS_ONLY"
                              ? "border-amber/20 bg-amber/50 text-amber-700"
                              : "border-destructive/20 bg-destructive/50 text-destructive"
                          }`}
                        >
                          {ACCESS_LABELS[doc.accessLevel] ?? doc.accessLevel}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {doc.file?.fileName ?? "—"}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {doc.uploadedBy?.email ?? "—"}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {formatTanggalPendek(doc.createdAt)}
                      </td>
                      <td className="text-right space-x-2">
                        <a
                          href={`/api/files/${doc.fileId}`}
                          className="text-xs text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Unduh
                        </a>
                        {canDelete && (
                          <form action={deleteOrganizationDocumentFormAction} onSubmit={(e) => {
                            if (!confirm(`Hapus dokumen "${doc.title}"?`)) e.preventDefault();
                          }}>
                            <input type="hidden" name="id" value={doc.id} />
                            <Button type="submit" variant="destructive" size="sm" className="h-8 px-2">
                              Hapus
                            </Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
