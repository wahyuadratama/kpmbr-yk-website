import type { Metadata } from "next";
import {
  generateDigitalCardAction,
  revokeDigitalCardAction,
  getDigitalCardAction,
} from "@/server/actions/digital-member-card";
import { requirePortalPage } from "@/server/auth/guards";
import KartuForm from "@/ui/components/member/kartu-form";

export const metadata: Metadata = {
  title: "Kartu Anggota Digital",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Halaman kartu anggota digital — Stage 4.
 *
 * Server Component yang mengambil data kartu dan melewatkan Server Action
 * sebagai prop ke KartuForm (Client Component). Dengan demikian klien tidak
 * langsung mengimpor modul Prisma (Node.js-only), mencegah kesalahan build
 * 'Can\'t resolve fs/tls'.
 */
export default async function KartuPage() {
  await requirePortalPage("/member");

  const getResult = await getDigitalCardAction();
  const card = getResult.ok === true ? (getResult.data ?? null) : null;

  return (
    <KartuForm
      card={card}
      generateAction={generateDigitalCardAction}
      revokeAction={revokeDigitalCardAction}
    />
  );
}
