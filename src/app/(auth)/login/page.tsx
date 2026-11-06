import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentPrincipal } from "@/server/auth/guards";
import { siteConfig } from "@/shared/site-config";
import { LoginForm } from "./login-form";
import logo from "@/assets/kpmbr-logo.png";

export const metadata: Metadata = {
  title: "Masuk — " + siteConfig.name,
  description: `Masuk ke portal anggota dan pengurus ${siteConfig.displayName}.`,
  robots: { index: false, follow: false },
};

/** Halaman login: tidak boleh pernah ikut ter-cache. */
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Sudah punya sesi valid? Jangan tampilkan form lagi.
  const principal = await getCurrentPrincipal();
  if (principal) redirect("/admin");

  const { next } = await searchParams;
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-gray-50 px-4 py-6">
      <div className="w-full max-w-[640px]">
        {/* Header identitas organisasi — bagian atas kiri */}
        <header className="mb-4 flex items-center gap-3">
          <div className="flex size-[42px] items-center justify-center rounded-lg bg-[#214A83] shrink-0">
            <Image
              src={logo}
              alt="Logo KPMBR-YK"
              width={42}
              height={42}
              className="size-6 shrink-0"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-semibold leading-none tracking-tight text-foreground">
              KPMBR-YK
            </span>
            <span className="text-sm leading-none text-muted-foreground">
              Portal Organisasi
            </span>
          </div>
        </header>

        {/* Dua panel berdampingan (desktop) / bertumpuk (mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Panel kiri — biru tua */}
          <section
            className="min-h-[320px] flex flex-col justify-between rounded-xl bg-[#214A83] p-5 text-white"
          >
            <div className="space-y-3">
              <span className="text-[14px] font-medium uppercase tracking-wider opacity-80">
                PORTAL RESMI
              </span>
              <h1 className="text-[25px] font-bold leading-tight">
                Ngahiji dina Duduluran.
              </h1>
              <p className="text-[16px] leading-relaxed opacity-90">
                Ruang bersama untuk anggota dan pengurus KPMBR-YK.
              </p>
            </div>
            <p className="text-[12px] opacity-60">
              Ti Bandung Raya, Ngahiji di Yogyakarta.
            </p>
          </section>

          {/* Panel kanan — putih */}
          <div className="min-h-[320px] flex flex-col rounded-xl bg-white p-5 border border-gray-200">
            <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
              Selamat datang
            </h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Masuk untuk melanjutkan ke portal Anda.
            </p>

            <LoginForm next={target} />

            <p className="mt-5 text-center text-[13px] text-muted-foreground">
              <Link
                href="/"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Kembali ke beranda
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
