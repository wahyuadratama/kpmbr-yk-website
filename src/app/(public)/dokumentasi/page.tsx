import * as React from "react";
import type { Metadata } from "next";
import { Images } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MockDataNotice } from "@/components/public/mock-data-notice";
import { AlbumCard } from "@/components/public/album-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAlbums } from "@/modules/documentation/queries";

export const metadata: Metadata = {
  title: "Dokumentasi",
  description:
    "Album dokumentasi kegiatan KPMBR-YK: musyawarah besar, bakti sosial, diskusi mahasiswa, dan gathering.",
  alternates: { canonical: "/dokumentasi" },
};

/** Daftar album dokumentasi, terbaru lebih dulu. */
export default async function DokumentasiPage() {
  const albums = await getAlbums();

  return (
    <>
      <PageHeader
        eyebrow="Arsip Visual"
        title="Dokumentasi"
        description="Jejak kegiatan organisasi yang dikelompokkan per kegiatan. Album diperbarui setelah setiap kegiatan selesai."
      >
        <MockDataNotice scope="seluruh album dan jumlah foto" />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {albums.length === 0 ? (
          <EmptyState
            icon={Images}
            title="Belum ada dokumentasi"
            description="Album dokumentasi akan tampil di sini setelah diunggah pengurus."
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
                <AlbumCard key={album.slug} album={album} />
              ))}
            </div>
            <p className="mt-10 text-sm text-muted-foreground">
              Foto dan video lengkap kegiatan dapat diakses anggota melalui
              portal internal sesuai tingkat akses dokumen.
            </p>
          </>
        )}
      </div>
    </>
  );
}