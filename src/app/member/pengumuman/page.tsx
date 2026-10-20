import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { AnnouncementList } from "@/components/member/announcement-list";
import { AnnouncementAudience } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Pengumuman" };
export const dynamic = "force-dynamic";

/** Pengumuman untuk anggota (publik dan khusus anggota). */
export default async function MemberAnnouncementPage() {
  await requirePortalPage("/member");

  return (
    <div className="space-y-5">
      <PageHeading
        title="Pengumuman"
        description="Informasi resmi dari pengurus untuk anggota dan masyarakat."
      />
      <Panel>
        <AnnouncementList
          audience={[AnnouncementAudience.PUBLIC, AnnouncementAudience.ANGGOTA]}
        />
      </Panel>
    </div>
  );
}
