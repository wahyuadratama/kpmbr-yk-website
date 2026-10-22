/**
 * Tampilan CMS transaksi keuangan — dipakai bersama oleh portal `/admin`,
 * `/bendahara`, dan `/pengurus`.
 *
 * Satu implementasi tampilan; route hanya berbeda pada guard portalnya dan
 * pada permission yang dimiliki role tersebut.
 */
import { hasPermission } from "@/lib/auth/permissions";
import type { Principal } from "@/lib/auth/principal";
import { db } from "@/lib/db/prisma";
import { listFinancialTransactions } from "@/modules/finance/queries";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DashboardPagination } from "@/components/dashboard/pagination";
import { ConfirmActionForm } from "@/components/internal/confirm-action-form";
import { TransactionForm } from "@/components/bendahara/transaction-form";
import {
  createFinancialTransactionFormAction,
  deleteFinancialTransactionFormAction,
} from "@/modules/finance/form-actions";
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
import { formatRupiah, formatTanggalPendek } from "@/lib/utils/format";
import { todayInOrganizationTimezone } from "@/lib/utils/datetime";
import { FinancialTransactionType } from "@/generated/prisma/enums";

const PAGE_SIZE = 15;

/**
 * CMS transaksi keuangan.
 *
 * Pencarian dan filter berjalan di server lewat query string, sehingga URL
 * dapat dibagikan dan tidak memerlukan JavaScript.
 *
 * Tombol aksi hanya muncul bila role punya permission-nya; peran read-only
 * (mis. pengurus) tetap dapat melihat daftar tanpa bisa mengubah.
 */
export async function TransaksiAdminView({
  principal,
  searchParams,
  basePath = "/bendahara/transaksi",
}: {
  principal: Principal;
  searchParams: { q?: string; type?: string; page?: string };
  /** Prefix route portal ini, dipakai untuk tautan filter dan pagination. */
  basePath?: string;
}) {
  const params = searchParams;

  const canRead = hasPermission(principal.role, "finance:read_transaction");
  const canCreate = hasPermission(principal.role, "finance:create");
  const canDelete = hasPermission(principal.role, "finance:delete");

  const q = (params.q ?? "").trim();
  const type =
    params.type === FinancialTransactionType.INCOME ||
    params.type === FinancialTransactionType.EXPENSE
      ? params.type
      : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [categories, transactions] = await Promise.all([
    canRead
      ? db.financialCategory.findMany({
          where: { deletedAt: null },
          orderBy: [{ type: "asc" }, { name: "asc" }],
          select: { id: true, name: true, type: true },
        })
      : Promise.resolve([]),
    canRead
      ? listFinancialTransactions({ q, type, page, size: PAGE_SIZE })
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          size: PAGE_SIZE,
          pages: 1,
        }),
  ]);

  const buildHref = (target: { page?: number } = {}) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (type) query.set("type", type);
    if (target.page && target.page > 1) query.set("page", String(target.page));
    const search = query.toString();
    return search ? `${basePath}?${search}` : basePath;
  };

  return (
    <div className="space-y-5">
      <PageHeading
        title="Transaksi"
        description="Catat pemasukan dan pengeluaran organisasi. Saldo dihitung dari transaksi tersimpan, bukan dari input manual."
      />

      {canCreate ? (
        <Panel title="Catat Transaksi" description="Isi nominal tanpa titik atau koma.">
          <TransactionForm
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
              type: category.type,
            }))}
            action={createFinancialTransactionFormAction}
            defaultDate={todayInOrganizationTimezone()}
          />
        </Panel>
      ) : null}

      <Panel bodyClassName="p-4">
        <form method="get" className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="q" className="text-xs">
              Cari deskripsi
            </Label>
            <Input id="q" name="q" defaultValue={q} placeholder="Kata kunci" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type" className="text-xs">
              Jenis
            </Label>
            <select
              id="type"
              name="type"
              defaultValue={type ?? ""}
              className="block h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Semua jenis</option>
              <option value={FinancialTransactionType.INCOME}>Pemasukan</option>
              <option value={FinancialTransactionType.EXPENSE}>Pengeluaran</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">
              Terapkan
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={basePath}>Reset</a>
            </Button>
          </div>
        </form>
      </Panel>

      <Panel bodyClassName="p-0">
        {transactions.items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            {q || type
              ? "Tidak ada transaksi yang cocok dengan filter."
              : "Belum ada transaksi tercatat."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                {canDelete ? <TableHead className="text-right">Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm text-dashboard-text-muted">
                    {formatTanggalPendek(item.date)}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-sm font-medium">
                    {item.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-dashboard-text-muted">
                    {item.category.name}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={
                        item.type === FinancialTransactionType.INCOME
                          ? "success"
                          : "warning"
                      }
                    >
                      {item.type === FinancialTransactionType.INCOME
                        ? "Pemasukan"
                        : "Pengeluaran"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    {formatRupiah(item.amount)}
                  </TableCell>
                  {canDelete ? (
                    <TableCell className="text-right">
                      <ConfirmActionForm
                        action={deleteFinancialTransactionFormAction}
                        id={item.id}
                        confirmMessage="Hapus transaksi ini? Transaksi tidak dapat dihapus permanen."
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

      <DashboardPagination
        page={transactions.page}
        pages={transactions.pages}
        total={transactions.total}
        size={PAGE_SIZE}
        buildHref={(target) => buildHref({ page: target })}
      />
    </div>
  );
}
