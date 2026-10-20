import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { EventList } from "@/components/member/event-list";

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
