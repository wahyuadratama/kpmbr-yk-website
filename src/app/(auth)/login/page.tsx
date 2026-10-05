import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPrincipal } from "@/lib/auth/guards";
import { siteConfig } from "@/lib/site-config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: `Masuk ke portal anggota dan pengurus ${siteConfig.displayName}.`,
  robots: { index: false, follow: false },
};

/** Halaman privat: tidak boleh pernah ikut ter-cache. */
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-16">
      <header className="space-y-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">Portal anggota</p>
        <h1 className="text-2xl font-semibold tracking-tight">Masuk ke akun Anda</h1>
        <p className="text-sm text-muted-foreground">{siteConfig.displayName}</p>
      </header>

      <LoginForm next={target} />

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/" className="underline underline-offset-4 hover:text-foreground">
          Kembali ke beranda
        </Link>
      </p>
    </main>
  );
}