import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/ui/components/layout/page-header";
import { siteConfig } from "@/shared/site-config";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: `Syarat, ketentuan, hak dan kewajiban warga, serta kebijakan penggunaan website ${siteConfig.fullName}.`,
  alternates: { canonical: "/syarat-ketentuan" },
};

function Section({ id, title, source, children }: { id: string; title: string; source: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12 scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-2xl font-semibold tracking-tight">{title}</h2>
        <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {source}
        </span>
      </div>
      <div className="mt-4 space-y-3 text-base leading-[1.8] text-foreground/90">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-brand/40" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-brand/20 bg-brand-muted/40 p-4 text-sm leading-relaxed text-foreground/90">
      {children}
    </div>
  );
}

export default function SyaratKetentuanPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ketentuan"
        title="Syarat & Ketentuan"
        description={`Ketentuan keanggotaan dan kebijakan penggunaan website ${siteConfig.fullName}. Halaman ini dapat dibuka tanpa login.`}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section aria-labelledby="pendahuluan">
              <h2 id="pendahuluan" className="text-2xl font-semibold tracking-tight">Pendahuluan</h2>
              <div className="mt-4 space-y-3 text-base leading-[1.8] text-foreground/90">
                <p>
                  <strong>{siteConfig.fullName} ({siteConfig.name})</strong> adalah wadah yang menghimpun pelajar dan
                  mahasiswa asal Kabupaten Bandung, Kota Bandung, Kota Cimahi, dan Kabupaten Bandung Barat yang sedang
                  menuntut ilmu di Daerah Istimewa Yogyakarta (AD Pasal 1, 4).
                </p>
                <p>
                  Organisasi berasaskan Pancasila dan Undang-Undang Dasar 1945, berwatak kedaerahan (primordial),
                  serta bersifat pengkaderan, kemahasiswaan, kemasyarakatan, dan independen (AD Pasal 5–7).
                </p>
                <p>
                  KPMBR-YK bertujuan menjadi wadah pemersatu dan pengkaderan; menumbuhkan persaudaraan dan
                  kekeluargaan; membentuk kader yang kreatif, kritis, dan peduli; menampung serta menyalurkan
                  aspirasi, pemikiran, dan karya cipta; serta menjadi sarana kontrol sosial terhadap kebijakan
                  pemerintah daerah (AD Pasal 9–10).
                </p>
              </div>
            </section>

            <Section id="keanggotaan" title="Keanggotaan (Jenis Warga)" source="ART Pasal 2">
              <p>Warga KPMBR-YK terdiri atas:</p>
              <ul className="space-y-3">
                <li className="rounded-lg border border-border bg-card p-4">
                  <p className="font-semibold">Warga biasa</p>
                  <p className="mt-1 text-sm text-muted-foreground">Pelajar atau mahasiswa yang memenuhi ketentuan kewargaan organisasi.</p>
                </li>
                <li className="rounded-lg border border-border bg-card p-4">
                  <p className="font-semibold">Warga luar biasa</p>
                  <p className="mt-1 text-sm text-muted-foreground">Alumni mahasiswa asal Bandung Raya yang pernah menjadi bagian KPMBR-YK.</p>
                </li>
                <li className="rounded-lg border border-border bg-card p-4">
                  <p className="font-semibold">Warga kehormatan</p>
                  <p className="mt-1 text-sm text-muted-foreground">Pihak yang berjasa terhadap KPMBR-YK dan ditetapkan melalui forum organisasi.</p>
                </li>
              </ul>
            </Section>

            <Section id="hak-warga" title="Hak Warga" source="ART Pasal 3">
              <Bullets
                items={[
                  "Warga biasa mempunyai hak bicara dan hak suara sesuai ketentuan forum.",
                  "Setiap warga berhak mengikuti kegiatan KPMBR-YK, kecuali ada ketentuan lain.",
                  "Warga luar biasa dan warga kehormatan mempunyai hak bicara.",
                  "Hak memilih dan dipilih diatur sesuai ketentuan forum dan peraturan organisasi.",
                ]}
              />
            </Section>

            <Section id="kewajiban-warga" title="Kewajiban Warga" source="ART Pasal 4">
              <Bullets
                items={[
                  "Menjaga dan menjunjung tinggi nama baik organisasi.",
                  "Menjaga nama baik Kabupaten Bandung, Kota Bandung, Kota Cimahi, Kabupaten Bandung Barat, Daerah Istimewa Yogyakarta, dan Jawa Barat.",
                  "Menaati Anggaran Dasar/Anggaran Rumah Tangga (AD/ART) dan peraturan organisasi.",
                  "Mempertanggungjawabkan amanah organisasi yang diberikan.",
                  "Mendukung kegiatan KPMBR-YK.",
                ]}
              />
            </Section>

            <Section id="keuangan" title="Keuangan & Transparansi" source="ART Pasal 14 + kebijakan pengurus">
              <p>Ketentuan keuangan organisasi (ART Pasal 14):</p>
              <Bullets
                items={[
                  "Keuangan organisasi dapat berasal dari hibah, donasi, dan sumber sah lainnya.",
                  "Penggunaan keuangan ditetapkan berdasarkan program kerja dan kebutuhan organisasi.",
                  "Seluruh pemasukan dan pengeluaran dicatat serta dipertanggungjawabkan.",
                ]}
              />
              <Note>
                <strong>Kebijakan website (keputusan pengurus, bukan pasal AD/ART):</strong> seluruh anggota yang sudah login dapat melihat
                rincian transaksi keuangan (pemasukan dan pengeluaran), bukan hanya laporan yang sudah terbit.
              </Note>
            </Section>

            <Section id="privasi" title="Privasi Data" source="Kebijakan pengurus (website)">
              <Note>
                Bagian ini merupakan <strong>kebijakan penggunaan website</strong> (keputusan pengurus), bukan kutipan pasal AD/ART.
              </Note>
              <Bullets
                items={[
                  "Data pribadi anggota tidak dibagikan ke pihak luar tanpa izin.",
                  "Direktori alumni bersifat opt-in: data hanya tampil bila anggota mengizinkan pada pengaturan profil.",
                  "Data anggota dan alumni disimpan selama yang bersangkutan menjadi anggota/alumni karena dibutuhkan untuk direktori dan verifikasi.",
                ]}
              />
            </Section>

            <Section id="website-akun" title="Penggunaan Website & Akun" source="Kebijakan pengurus (website)">
              <Note>
                Bagian ini merupakan <strong>kebijakan penggunaan website</strong> (keputusan pengurus), bukan kutipan pasal AD/ART.
              </Note>
              <Bullets
                items={[
                  "Pendaftaran anggota bersifat manual: anggota mengisi data sendiri lewat form pengajuan, lalu sekretariat/admin memverifikasi dan menyetujui melalui CMS; pengajuan yang disetujui baru menjadi anggota aktif.",
                  "Kartu anggota digital dinonaktifkan saat anggota resmi beralih status menjadi alumni.",
                  "Pengguna wajib menjaga kerahasiaan kredensial akun dan bertanggung jawab atas aktivitas yang dilakukan melalui akunnya.",
                ]}
              />
              <p className="text-sm text-muted-foreground">
                Ajukan atau kelola data keanggotaan melalui halaman{" "}
                <Link href="/keanggotaan" className="underline underline-offset-4 hover:text-foreground">Keanggotaan</Link>{" "}
                dan profil anggota (setelah login).
              </p>
            </Section>

            <Section id="penutup" title="Penutup" source="ART Pasal 18 ayat 1">
              <p>
                Setiap warga dianggap telah mengetahui Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) setelah
                AD/ART dipublikasikan kepada warga (ART Pasal 18 ayat 1).
              </p>
              <Note>
                <strong>Catatan:</strong> Halaman ini disusun berdasarkan <strong>AD/ART KPMBR-YK Periode 2026–2027 (Draft)</strong>.
                Tanggal penetapan belum diisi. Ketentuan yang ditandai sebagai &quot;kebijakan pengurus (website)&quot; bukan
                merupakan pasal AD/ART.
              </Note>
            </Section>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-20 rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">Daftar isi</h2>
              <nav aria-label="Daftar isi syarat dan ketentuan" className="mt-4">
                <ol className="flex flex-col gap-2 text-sm">
                  {[
                    ["pendahuluan", "Pendahuluan"],
                    ["keanggotaan", "Keanggotaan (Jenis Warga)"],
                    ["hak-warga", "Hak Warga"],
                    ["kewajiban-warga", "Kewajiban Warga"],
                    ["keuangan", "Keuangan & Transparansi"],
                    ["privasi", "Privasi Data"],
                    ["website-akun", "Penggunaan Website & Akun"],
                    ["penutup", "Penutup"],
                  ].map(([href, label]) => (
                    <li key={href}>
                      <a href={`#${href}`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                        {label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                Sumber: AD/ART KPMBR-YK Periode 2026–2027 (Draft) + kebijakan pengurus website. Dapat dibuka tanpa login.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
