import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
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
    <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-4 py-12">
      <section className="flex w-full flex-col items-center justify-center gap-6 max-w-sm">
        <div className="flex items-center gap-2">
          <Image
            src={logo}
            alt="Logo KPMBR-YK"
            width={40}
            height={40}
            className="shrink-0"
          />
          <span className="font-semibold text-lg tracking-tight text-foreground">
            {siteConfig.name}
          </span>
        </div>

        <header className="space-y-1 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Portal anggota dan pengurus
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Masuk ke akun Anda
          </h1>
          <p className="text-sm text-muted-foreground">
            {siteConfig.displayName}
          </p>
        </header>

        <LoginForm next={target} />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Kembali ke beranda
          </Link>
        </p>
      </section>
    </main>
  );
}
