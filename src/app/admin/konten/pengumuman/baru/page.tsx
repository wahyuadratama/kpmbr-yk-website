import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { AnnouncementEditorForm } from "@/components/admin/announcement-editor-form";
import { createAnnouncementFormAction } from "@/modules/announcements/form-actions";
import { AnnouncementAudience, AnnouncementPriority } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Buat Pengumuman" };
export const dynamic = "force-dynamic";

/** Formulir membuat pengumuman baru. */
export default async function NewAnnouncementPage() {
  await requirePermissionPage("announcement:create");

  return (
    <div className="space-y-5">
      <PageHeading
        title="Buat Pengumuman"
        description="Audiens menentukan siapa yang boleh membaca pengumuman ini."
      />

      <Panel title="Detail Pengumuman" className="max-w-3xl">
        <AnnouncementEditorForm
          initial={{
            title: "",
            body: "",
            priority: AnnouncementPriority.NORMAL,
            audience: AnnouncementAudience.PUBLIC,
          }}
          action={createAnnouncementFormAction}
          submitLabel="Simpan pengumuman"
        />
      </Panel>
    </div>
  );
}
