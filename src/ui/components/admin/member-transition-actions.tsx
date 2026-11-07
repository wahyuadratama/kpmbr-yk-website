"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type TransisiResult } from "@/server/actions/alumni";
import { Button } from "@/ui/components/ui/button";

type Props = {
  memberId: string;
  memberName: string;
  currentStatus: string | null;
  action: typeof import("@/server/actions/alumni").transisiKeanggotaanAction;
};

const initial: TransisiResult = { ok: false };

export function MemberTransitionActions({ memberId, memberName, currentStatus, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const canLulus = currentStatus === "AKTIF";
  const canAlumni = currentStatus === "LULUS";

  function confirmAndSubmit(form: HTMLFormElement, label: string) {
    if (window.confirm(`${label} untuk ${memberName}? Tindakan ini tercatat di audit log.`)) {
      form.requestSubmit();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {canLulus && (
        <form action={formAction} className="flex items-center gap-1">
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="action" value="MARK_LULUS" />
          <input
            name="graduationYear"
            type="number"
            defaultValue={new Date().getFullYear()}
            className="h-7 w-20 rounded border px-2 text-xs"
            aria-label="Tahun lulus"
            title="Tahun lulus"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={(e) => confirmAndSubmit(e.currentTarget.form!, "Tandai LULUS")}
          >
            Tandai Lulus
          </Button>
        </form>
      )}
      {canAlumni && (
        <form action={formAction}>
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="action" value="MARK_ALUMNI" />
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={(e) => confirmAndSubmit(e.currentTarget.form!, "Jadikan ALUMNI")}
          >
            Jadikan Alumni
          </Button>
        </form>
      )}
      {!canLulus && !canAlumni && (
        <span className="text-xs text-muted-foreground">—</span>
      )}
      {!state.ok && state.error ? (
        <p className="max-w-[220px] text-right text-[11px] text-destructive">{state.error.message}</p>
      ) : null}
      {state.ok ? (
        <p className="text-[11px] text-emerald-700">Berhasil → {state.data?.toStatus}</p>
      ) : null}
    </div>
  );
}
