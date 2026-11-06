"use client";

import { useActionState } from "react";
import { Button } from "@/ui/components/ui/button";
import KartuQr from "@/ui/components/member/kartu-qr";
import {
  type DigitalCardResult,
  type DigitalCardData,
} from "@/server/actions/digital-member-card";

type KartuFormProps = {
  card: DigitalCardData | null;
  generateAction: typeof import("@/server/actions/digital-member-card").generateDigitalCardAction;
  revokeAction: typeof import("@/server/actions/digital-member-card").revokeDigitalCardAction;
};

export default function KartuForm({
  card,
  generateAction,
  revokeAction,
}: KartuFormProps) {
  const [genState, genAction] = useActionState(
    generateAction,
    { ok: false } as DigitalCardResult,
  );

  const [revState, revokeActionBound] = useActionState(
    revokeAction,
    { ok: false } as DigitalCardResult,
  );

  const genError = genState.ok === false ? genState.error : undefined;
  const genData = genState.ok === true ? genState.data : undefined;
  const token = genData?.token ?? null;

  const revError = revState.ok === false ? revState.error : undefined;
  const revOk = revState.ok === true;

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Kartu anggota digital
        </h1>
        <p className="text-sm text-muted-foreground">
          Kartu digital untuk verifikasi keanggotaan melalui QR code.
        </p>
      </section>

      {!card && (
        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Buat kartu digital</h2>
          <p className="text-sm text-muted-foreground">
            Token verifikasi akan ditampilkan sekali saja setelah pembuatan.
            Simpan dengan aman.
          </p>

          <form action={genAction} className="space-y-4">
            {genError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/50 p-3 text-sm text-destructive">
                {genError.message}
              </div>
            )}
            <Button type="submit" disabled={genData !== undefined}>
              {genData !== undefined ? "Kartu sudah ada" : "Buat kartu digital"}
            </Button>
          </form>

          {token && (
            <div className="rounded-lg border border-emerald/20 bg-emerald/50 p-4">
              <h3 className="text-sm font-semibold text-emerald-900">
                Token verifikasi (tampilkan sekali)
              </h3>
              <p className="text-sm font-mono text-emerald-900 break-all mt-1">
                {token}
              </p>
              <p className="text-xs text-emerald-700 mt-2">
                Salin token ini dan simpan di tempat aman. Token tidak akan
                ditampilkan lagi di sistem.
              </p>
            </div>
          )}
        </section>
      )}

      {card && (
        <section className="space-y-4">
          <KartuQr
            token={token ?? ""}
            publicKey={card.publicKey}
            memberCode="-"
            fullName="-"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Status kartu</h3>
              <p className={`text-xs font-medium ${
                card.isActive ? "text-emerald-700" : "text-destructive"
              }`}>
                {card.isActive ? "Aktif" : "Dicabut"}
              </p>
              <p className="text-xs text-muted-foreground">
                Dibuat pada{" "}
                {card.createdAt?.toLocaleDateString("id-ID") ?? "—"}
              </p>
            </div>

            {card.isActive ? (
              <form action={revokeActionBound} className="space-y-2">
                <Button type="submit" variant="destructive" size="sm">
                  Cabut kartu
                </Button>
                {revError && (
                  <p className="text-xs text-destructive">
                    {revError.message}
                  </p>
                )}
                {revOk && (
                  <p className="text-xs text-emerald-700">
                    Kartu berhasil dicabut.
                  </p>
                )}
              </form>
            ) : (
              <div className="rounded-lg border border-destructive/50 bg-destructive/50 p-4">
                <h3 className="text-sm font-semibold text-destructive">
                  Kartu tidak aktif
                </h3>
                <p className="text-xs text-destructive">
                  Kartu ini telah dicabut. Buat kartu baru bila diperlukan.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
