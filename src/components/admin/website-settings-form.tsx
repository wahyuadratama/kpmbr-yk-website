"use client";

/**
 * Formulir pengaturan website.
 *
 * Mengubah identitas, kontak, dan metadata SEO yang ditampilkan di seluruh
 * situs publik. Perubahan dicatat audit log.
 */
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions/result";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Menyimpan..." : "Simpan pengaturan"}
    </Button>
  );
}

export type WebsiteSettingsValues = {
  siteName: string;
  siteDescription: string;
  slogan: string;
  organizationName: string;
  contactEmail: string;
  contactInstagram: string;
  addressLine: string;
  city: string;
  region: string;
  seoTitle: string;
  seoDescription: string;
};

export function WebsiteSettingsForm({
  initial,
  action,
}: {
  initial: WebsiteSettingsValues;
  action: (
    prev: unknown,
    formData: FormData,
  ) => Promise<ActionResult<{ saved: true }>>;
}) {
  const [state, formAction] = useActionState(action, {
    ok: false,
    error: { code: "BAD_REQUEST", message: "" },
  } as ActionResult<{ saved: true }>);

  const error = state.ok ? "" : state.error.message;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="siteName">Nama website</Label>
          <Input
            id="siteName"
            name="siteName"
            defaultValue={initial.siteName}
            placeholder="KPMBR-YK"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="organizationName">Nama organisasi</Label>
          <Input
            id="organizationName"
            name="organizationName"
            defaultValue={initial.organizationName}
            placeholder="Keluarga Pelajar dan Mahasiswa Bandung Raya Yogyakarta"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slogan">Slogan</Label>
        <Input
          id="slogan"
          name="slogan"
          defaultValue={initial.slogan}
          placeholder="Ti Bandung Raya, Ngahiji di Yogyakarta."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="siteDescription">Deskripsi singkat</Label>
        <Textarea
          id="siteDescription"
          name="siteDescription"
          rows={3}
          defaultValue={initial.siteDescription}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">Email kontak</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={initial.contactEmail}
            placeholder="sekretariat@kpmbr.id"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactInstagram">Instagram</Label>
          <Input
            id="contactInstagram"
            name="contactInstagram"
            defaultValue={initial.contactInstagram}
            placeholder="https://instagram.com/kpmbr"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor="addressLine">Alamat sekretariat</Label>
          <Input
            id="addressLine"
            name="addressLine"
            defaultValue={initial.addressLine}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Kota</Label>
          <Input id="city" name="city" defaultValue={initial.city} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="region">Provinsi / daerah</Label>
          <Input id="region" name="region" defaultValue={initial.region} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="seoTitle">Judul SEO</Label>
        <Input
          id="seoTitle"
          name="seoTitle"
          defaultValue={initial.seoTitle}
          placeholder="KPMBR-YK — Keluarga Pelajar dan Mahasiswa Bandung Raya Yogyakarta"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="seoDescription">Deskripsi SEO</Label>
        <Textarea
          id="seoDescription"
          name="seoDescription"
          rows={2}
          defaultValue={initial.seoDescription}
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs text-dashboard-danger">
          {error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-xs text-dashboard-success">
          Pengaturan berhasil disimpan.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
