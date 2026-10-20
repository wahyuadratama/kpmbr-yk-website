"use client";

/**
 * Panel status website & kontrol pemeliharaan.
 *
 * Status disimpan permanen di database dan dibaca `src/proxy.ts` pada setiap
 * request, jadi tidak ada deployment ulang yang diperlukan.
 *
 * Aktivasi maintenance meminta konfirmasi eksplisit karena website langsung
 * tidak dapat diakses pengunjung.
 */
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { ActionResult } from "@/lib/actions/result";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Menyimpan..." : "Simpan status"}
    </Button>
  );
}

export function MaintenancePanel({
  isEnabled,
  message,
  estimateAt,
  action,
}: {
  isEnabled: boolean;
  message: string;
  estimateAt: string;
  action: (prev: unknown, formData: FormData) => Promise<ActionResult<unknown>>;
}) {
  const [state, formAction] = useActionState(action, {
    ok: false,
    error: { code: "BAD_REQUEST", message: "" },
  } as ActionResult<unknown>);

  const saved = state.ok;
  const error = state.ok ? "" : state.error.message;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StatusBadge tone={isEnabled ? "warning" : "success"}>
          {isEnabled ? "Mode Pemeliharaan" : "Operasional"}
        </StatusBadge>
        {isEnabled ? (
          <TriangleAlert aria-hidden="true" className="size-4 text-dashboard-warning" />
        ) : (
          <CircleCheck aria-hidden="true" className="size-4 text-dashboard-success" />
        )}
      </div>

      <p className="text-xs leading-relaxed text-dashboard-text-muted">
        {isEnabled
          ? "Pengunjung melihat halaman pemeliharaan. Portal CMS tetap dapat diakses karena masing-masing punya proteksi sendiri."
          : "Website dapat diakses pengunjung dan seluruh halaman publik berjalan normal."}
      </p>

      <form
        action={formAction}
        className="space-y-3"
        onSubmit={(event) => {
          const enabled = (
            event.currentTarget.elements.namedItem("isMaintenanceEnabled") as HTMLInputElement | null
          )?.checked;
          if (
            enabled &&
            !window.confirm(
              "Aktifkan mode pemeliharaan? Pengunjung akan melihat halaman pemeliharaan.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <div className="flex items-center gap-2">
          <input
            id="isMaintenanceEnabled"
            name="isMaintenanceEnabled"
            type="checkbox"
            defaultChecked={isEnabled}
            className="size-4 rounded border-dashboard-border accent-dashboard-primary"
          />
          <Label htmlFor="isMaintenanceEnabled" className="text-sm font-normal">
            Aktifkan mode pemeliharaan
          </Label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maintenanceMessage" className="text-xs">
            Pesan untuk pengunjung
          </Label>
          <Textarea
            id="maintenanceMessage"
            name="maintenanceMessage"
            rows={3}
            defaultValue={message}
            placeholder="Contoh: Website sedang dalam pemeliharaan terjadwal."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maintenanceEstimateAt" className="text-xs">
            Perkiraan selesai (opsional)
          </Label>
          <Input
            id="maintenanceEstimateAt"
            name="maintenanceEstimateAt"
            type="datetime-local"
            defaultValue={estimateAt}
          />
        </div>

        {error ? (
          <p role="alert" className="text-xs text-dashboard-danger">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="text-xs text-dashboard-success">
            Status pemeliharaan tersimpan dan langsung berlaku.
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </div>
  );
}
