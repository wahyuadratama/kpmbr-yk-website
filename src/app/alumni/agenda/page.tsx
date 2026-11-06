import type { Metadata } from "next";
import { requirePortalPage } from "@/server/auth/guards";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import { EventList } from "@/ui/components/member/event-list";

export const metadata: Metadata = { title: "Agenda" };
export const dynamic = "force-dynamic";

/** Agenda kegiatan untuk alumni. */
export default async function AlumniAgendaPage() {
  await requirePortalPage("/alumni");

  return (
    <div className="space-y-5">
      <PageHeading
        title="Agenda"
        description="Kegiatan organisasi yang sudah terjadwal dan akan datang."
      />
      <Panel>
        <EventList />
      </Panel>
    </div>
  );
}
