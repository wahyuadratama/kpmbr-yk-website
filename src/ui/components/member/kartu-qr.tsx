"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type KartuQrProps = {
  token: string;
  publicKey: string;
  memberCode: string;
  fullName: string;
};

export default function KartuQr({
  token,
  publicKey,
  memberCode,
  fullName,
}: KartuQrProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // Isi QR adalah token opaque. Pemegang kartu menunjukkan QR ini;
    // petugas memindai dan memverifikasi lewat /api/member-card/verify/[token].
    QRCode.toDataURL(token, { margin: 2, scale: 8, color: { dark: "#111827" } })
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch((err) => {
        if (mounted) setError("Gagal render QR.");
        console.error(err);
      });
    return () => { mounted = false; };
  }, [token]);

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-2xl bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Kartu Anggota Digital</h2>
        <p className="text-sm text-muted-foreground">
          Kode: <span className="font-mono">{memberCode}</span>
        </p>
        <p className="text-sm text-muted-foreground">{fullName}</p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/50 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : qrDataUrl ? (
        <>
          <img src={qrDataUrl} alt="QR kartu anggota" className="w-48 h-48" />
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            Tunjukkan QR ini kepada petugas untuk divalidasi. Token verifikasi
            hanya ditampilkan sekali saat pembuatan kartu.
          </p>
          <p className="text-xs text-muted-foreground font-mono break-all">
            Publik: {publicKey}
          </p>
        </>
      ) : (
        <div className="animate-pulse w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700" />
      )}
    </div>
  );
}
