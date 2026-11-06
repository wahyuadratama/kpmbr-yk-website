import type { Metadata } from "next";
import { requirePortalPage } from "@/server/auth/guards";
import { hasPermission } from "@/server/auth/permissions";
import { db } from "@/server/db/prisma";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import { StatusBadge } from "@/ui/components/dashboard/status-badge";
import { ConfirmActionForm } from "@/ui/components/internal/confirm-action-form";
import { CategoryForm } from "@/ui/components/bendahara/category-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/ui/table";
import {
  createFinancialCategoryFormAction,
  deleteFinancialCategoryFormAction,
} from "@/server/modules/finance/form-actions";
import { FinancialTransactionType } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Kategori Keuangan" };
export const dynamic = "force-dynamic";

/** Pengelolaan kategori pemasukan dan pengeluaran. */
export default async function KategoriPage() {
  const principal = await requirePortalPage("/bendahara");

  const canCreate = hasPermission(principal.role, "finance:create");
  const canDelete = hasPermission(principal.role, "finance:delete");

  const categories = await db.financialCategory.findMany({
    where: { deletedAt: null },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      _count: { select: { transactions: true } },
    },
  });

  return (
    <div className="space-y-5">
      <PageHeading
        title="Kategori Keuangan"
        description="Kategori mengelompokkan transaksi agar rekap per kategori akurat."
      />

      {canCreate ? (
        <Panel title="Tambah Kategori" className="max-w-3xl">
          <CategoryForm action={createFinancialCategoryFormAction} />
        </Panel>
      ) : null}

      <Panel bodyClassName="p-0">
        {categories.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            Belum ada kategori. Tambahkan kategori sebelum mencatat transaksi.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Transaksi</TableHead>
                {canDelete ? (
                  <TableHead className="text-right">Aksi</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="text-sm font-medium">{category.name}</TableCell>
                  <TableCell className="font-mono text-xs text-dashboard-text-muted">
                    {category.slug}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={
                        category.type === FinancialTransactionType.INCOME
                          ? "success"
                          : "warning"
                      }
                    >
                      {category.type === FinancialTransactionType.INCOME
                        ? "Pemasukan"
                        : "Pengeluaran"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-dashboard-text-muted">
                    {category._count.transactions}
                  </TableCell>
                  {canDelete ? (
                    <TableCell className="text-right">
                      <ConfirmActionForm
                        action={deleteFinancialCategoryFormAction}
                        id={category.id}
                        confirmMessage={`Hapus kategori "${category.name}"?`}
                      >
                        Hapus
                      </ConfirmActionForm>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
