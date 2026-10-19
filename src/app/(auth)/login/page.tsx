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
      {/* Kolom identitas — hanya ditampilkan pada desktop */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-center border-r border-brand/10 bg-brand/5 p-8">
        <div className="flex items-center gap-2 mb-6">
          <Image
            src={logo}
            alt="Logo KPMBR-YK"
            width={48}
            height={48}
            className="shrink-0"
          />
          <span className="font-semibold text-2xl tracking-tight text-foreground">
            KPMBR-YK
          </span>
        </div>
        <p className="text-sm font-medium text-brand-muted-foreground mb-4">
          Portal anggota dan pengurus
        </p>
        <p className="text-base text-muted-foreground leading-relaxed max-w-xs">
          Keluarga Pelajar dan Mahasiswa Bandung Raya Yogyakarta
        </p>
      </div>

      {/* Kolom autentikasi */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Identitas disederhanakan pada mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <Image
              src={logo}
              alt="Logo KPMBR-YK"
              width={32}
              height={32}
              className="shrink-0"
            />
            <span className="font-semibold text-lg tracking-tight text-foreground">
              KPMBR-YK
            </span>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
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

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link
              href="/"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Kembali ke beranda
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
