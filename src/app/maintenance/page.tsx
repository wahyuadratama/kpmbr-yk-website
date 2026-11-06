import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Wrench } from "lucide-react";
import { siteConfig } from "@/shared/site-config";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  getMaintenanceState,
} from "@/server/settings/website";
import logo from "@/assets/kpmbr-logo.png";

export const metadata: Metadata = {
  title: "Pemeliharaan Terjadwal — " + siteConfig.name,
  description: "Website KPMBR-YK sedang dalam pemeliharaan terjadwal.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Halaman pemeliharaan.
 *
 * Ditampilkan ketika admin mengaktifkan mode pemeliharaan. Halaman ini tetap
 * dapat diakses saat pemeliharaan aktif (dikeluarkan dari daftar pengecualian
 * di `src/proxy.ts`).
 */
export default async function MaintenancePage() {
  const state = await getMaintenanceState();
  const message = state.message?.trim() || DEFAULT_MAINTENANCE_MESSAGE;

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2.5">
          <Image
            src={logo}
            alt="Logo KPMBR-YK"
            width={40}
            height={40}
            className="shrink-0"
          />
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            KPMBR-YK
          </span>
        </div>

        <span className="mx-auto mt-8 grid size-12 place-items-center rounded-full bg-blue-50 text-blue-700">
          <Wrench aria-hidden="true" className="size-5" />
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">
          Pemeliharaan Terjadwal
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-gray-600">{message}</p>

        {state.estimateAt ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">
            <Clock aria-hidden="true" className="size-3.5" />
            Perkiraan selesai{" "}
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Asia/Jakarta",
            }).format(state.estimateAt)}
          </p>
        ) : null}

        <p className="mt-6 text-xs text-gray-500">
          {siteConfig.fullName}
        </p>
      </div>
    </main>
  );
}
