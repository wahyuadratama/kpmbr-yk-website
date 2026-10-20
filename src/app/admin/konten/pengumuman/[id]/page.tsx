import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { AnnouncementEditorForm } from "@/components/admin/announcement-editor-form";
import { updateAnnouncementFormAction } from "@/modules/announcements/form-actions";
import { formatTanggalPendek } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Sunting Pengumuman" };
export const dynamic = "force-dynamic";

/** Formulir menyunting pengumuman yang sudah ada. */
export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("announcement:update");

  const { id } = await params;
  const announcement = await db.announcement.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      body: true,
      priority: true,
      audience: true,
      updatedAt: true,
    },
  });

  if (!announcement) notFound();

  return (
    <div className="space-y-5">
      <PageHeading
        title="Sunting Pengumuman"
        description={`Terakhir diperbarui ${formatTanggalPendek(announcement.updatedAt)}.`}
      />

      <Panel title="Detail Pengumuman" className="max-w-3xl">
        <AnnouncementEditorForm
          initial={{
            id: announcement.id,
            title: announcement.title,
            body: announcement.body,
            priority: announcement.priority,
            audience: announcement.audience,
          }}
          action={updateAnnouncementFormAction}
          submitLabel="Simpan perubahan"
        />
      </Panel>
    </div>
  );
}
