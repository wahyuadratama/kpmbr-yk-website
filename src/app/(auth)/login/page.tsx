import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentPrincipal } from "@/lib/auth/guards";
import { siteConfig } from "@/lib/site-config";
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
    <main className="flex min-h-dvh w-full bg-background">
      {/* Area identitas organisasi — desktop */}
      <section
        className="hidden lg:flex lg:w-[44%] flex-col justify-between border-r border-brand/10 bg-brand/5 p-10"
      >
        <div className="space-y-8">
          <div className="flex items-center gap-2.5">
            <Image
              src={logo}
              alt="Logo KPMBR-YK"
              width={56}
              height={56}
              className="shrink-0"
            />
            <span className="font-bold text-2xl tracking-tight text-foreground">
              KPMBR-YK
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-brand muted-foreground">
              Portal anggota dan pengurus
            </h2>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
              Ti Bandung Raya,<br />
              Ngahiji di Yogyakarta.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Ruang bersama bagi anggota dan pengurus KPMBR-YK untuk menjaga
              persaudaraan, mengembangkan potensi, dan berkontribusi bagi
              organisasi.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex h-1 w-1 bg-brand rounded-full" />
            <span>Keluarga Pelajar dan Mahasiswa Bandung Raya Yogyakarta</span>
          </div>
        </div>
      </section>

      {/* Area autentikasi */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Identitas disederhanakan pada mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <Image
              src={logo}
              alt="Logo KPMBR-YK"
              width={36}
              height={36}
              className="shrink-0"
            />
            <span className="font-bold text-lg tracking-tight text-foreground">
              KPMBR-YK
            </span>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Masuk ke akun Anda
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Masuk ke portal anggota dan pengurus KPMBR-YK.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <LoginForm next={target} />
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link
              href="/"
              className="underline underline-offset-4 hover:text-foreground hover:text-brand"
            >
              Kembali ke beranda
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
