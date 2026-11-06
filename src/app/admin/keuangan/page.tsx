import type { Metadata } from "next";
import { requirePortalPage } from "@/server/auth/guards";
import { hasPermission } from "@/server/auth/permissions";
import { formatTanggalPendek } from "@/shared/utils/format";
import { EmptyState } from "@/ui/components/ui/empty-state";
import { ArrowRight, Inbox } from "lucide-react";
import { getFinancialSummary } from "@/server/modules/finance/queries";
import { listFinancialTransactions } from "@/server/modules/finance/queries";
import { listFinancialCategories } from "@/server/modules/finance/queries";
import {
  FinanceCategoryForm,
  FinanceTransactionForm,
} from "@/ui/components/admin/finance-form";

type Category = {
  id: string;
  name: string;
  slug: string;
  type: string;
};

export const metadata: Metadata = { title: "Keuangan" };
export const dynamic = "force-dynamic";

export default async function KeuanganPage() {
  const principal = await requirePortalPage("/admin");

  const canReadSummary = hasPermission(principal.role, "finance:read_summary");
  const canReadTransaction = hasPermission(principal.role, "finance:read_transaction");
  const canCreate = hasPermission(principal.role, "finance:create");

  const now = new Date();
  const summary = canReadSummary
    ? await getFinancialSummary({ year: now.getFullYear() }).catch(() => null)
    : null;

  const transactions = canReadTransaction
    ? (await listFinancialTransactions({ size: 10 })).items
    : [];

  const categories = canCreate ? await listFinancialCategories() : [];

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Keuangan</h1>
        <p className="text-sm text-muted-foreground">
          Transparansi pemasukan, pengeluaran, dan saldo organisasi.
        </p>
      </section>

      {!canReadSummary || !summary ? (
        <EmptyState
          icon={ArrowRight}
          title="Tidak ada akses ke data keuangan"
          description="Peran Anda tidak memiliki izin membaca laporan keuangan."
        />
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Ringkasan {summary.year}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total pemasukan
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">
                  {summary.incomeFormatted}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total pengeluaran
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
                  {summary.expenseFormatted}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Saldo
                </p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${
                  summary.balance >= 0 ? "text-emerald-600" : "text-destructive"
                }`}>
                  {summary.balanceFormatted}
                </p>
              </div>
            </div>
          </section>

          {canCreate && (
            <section className="space-y-6">
              <h2 className="text-lg font-semibold">Input Data</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <FinanceCategoryForm />
                <FinanceTransactionForm categories={categories as Category[]} />
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Transaksi terbaru</h2>
            {transactions.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Belum ada transaksi"
                description="Mulai mencatat pemasukan dan pengeluaran organisasi."
              />
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Tanggal</th>
                      <th className="p-3 text-left">Tipe</th>
                      <th className="p-3 text-left">Kategori</th>
                      <th className="p-3 text-left">Deskripsi</th>
                      <th className="p-3 text-right">Jumlah</th>
                      <th className="p-3 text-left">Dibuat oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((t: { id: string; date: Date; amount: bigint; type: string; description: string | null; category: { name: string } | null; createdBy: { email: string } | null; amountFormatted: string }) => (
                      <tr key={t.id} className="p-3">
                        <td className="text-muted-foreground">
                          {formatTanggalPendek(t.date)}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                              t.type === "INCOME"
                                ? "border-emerald/20 bg-emerald/50 text-emerald-700"
                                : "border-amber/20 bg-amber/50 text-amber-700"
                            }`}
                          >
                            {t.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </td>
                        <td className="text-muted-foreground text-sm">
                          {t.category?.name ?? "—"}
                        </td>
                        <td className="text-muted-foreground text-sm">
                          {t.description ?? "—"}
                        </td>
                        <td className="text-right tabular-nums font-medium">
                          {t.amountFormatted}
                        </td>
                        <td className="text-muted-foreground text-xs">
                          {t.createdBy?.email ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
