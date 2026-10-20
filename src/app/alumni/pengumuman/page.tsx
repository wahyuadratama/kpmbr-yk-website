import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { AnnouncementList } from "@/components/member/announcement-list";
import { AnnouncementAudience } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Pengumuman" };
export const dynamic = "force-dynamic";

/** Pengumuman untuk alumni (publik dan khusus alumni). */
export default async function AlumniAnnouncementPage() {
  await requirePortalPage("/alumni");

  return (
    <div className="space-y-5">
      <PageHeading
        title="Pengumuman"
        description="Informasi resmi dari pengurus untuk alumni dan masyarakat."
      />
      <Panel>
        <AnnouncementList
          audience={[AnnouncementAudience.PUBLIC, AnnouncementAudience.ALUMNI]}
        />
      </Panel>
    </div>
  );
}
