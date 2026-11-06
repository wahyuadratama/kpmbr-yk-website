import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { logoutAction } from "@/app/(auth)/login/actions";

/**
 * Halaman 403 — dirender oleh `forbidden()` dari `next/navigation` ketika
 * guard menolak role pemanggil.
 *
 * Pesan sengaja tidak menyebut halaman mana yang attempted, permission apa yang
 * hilang, atau role apa yang dimiliki pengguna. Membocorkan detail itu
 * membantu pihak yang tidak berhak memetakan batas privilege.
 *
 * `logoutAction` dipakai sebagai jalan keluar bila pengguna salah akun: tombol
 * kembali ke beranda tidak akan cukup karena guard di setiap portal tetap akan
 * menolak halaman tujuan.
 */
export default function Forbidden() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
      <span className="grid size-11 place-items-center rounded-full bg-surface text-muted-foreground">
        <ShieldAlert aria-hidden="true" className="size-5" />
      </span>

      <p className="mt-5 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Error 403
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Akses ditolak
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Akun kamu sudah masuk, tetapi halaman ini tidak terbuka untuk peran yang
        kamu miliki. Jika ini tidak sesuai, hubungi sekretariat.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="h-11 px-5">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 px-5">
          <Link href="/kontak">Hubungi sekretariat</Link>
        </Button>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="lg" className="h-11 px-5">
            Ganti akun
          </Button>
        </form>
      </div>
    </div>
  );
}