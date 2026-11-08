"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  approveMemberApplicationAction,
  rejectMemberApplicationAction,
} from "@/server/actions/member-application";
import type { ActionResult } from "@/server/actions/result";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";

type AnyRes = ActionResult<any>;

export function MemberApplicationActions({ id, applicantName }: { id: string; applicantName: string }) {
  const [approveState, approveAction, approving] = useActionState<AnyRes, FormData>(
    approveMemberApplicationAction,
    { ok: false, error: { code: "INTERNAL", message: "" } } as any,
  );
  const [rejectState, rejectAction, rejecting] = useActionState<AnyRes, FormData>(
    rejectMemberApplicationAction,
    { ok: false, error: { code: "INTERNAL", message: "" } } as any,
  );
  const router = useRouter();

  useEffect(() => {
    if (approveState?.ok || rejectState?.ok) router.refresh();
  }, [approveState?.ok, rejectState?.ok, router]);

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={approveAction}>
        <input type="hidden" name="id" value={id} />
        <Button
          type="button"
          size="sm"
          disabled={approving || rejecting}
          onClick={(e) => {
            if (window.confirm(`Setujui pengajuan ${applicantName}? Akun akan terhubung & member AKTIF.`))
              e.currentTarget.form!.requestSubmit();
          }}
        >
          Setujui
        </Button>
      </form>
      <form action={rejectAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={id} />
        <Input name="rejectionNote" placeholder="Alasan (opsional)" className="h-7 w-36 text-xs" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={approving || rejecting}
          onClick={(e) => {
            if (window.confirm(`Tolak pengajuan ${applicantName}?`)) e.currentTarget.form!.requestSubmit();
          }}
        >
          Tolak
        </Button>
      </form>
      {approveState?.ok ? (
        <p className="text-[11px] text-emerald-700">Disetujui: {approveState.data?.memberCode}</p>
      ) : null}
      {rejectState?.ok ? <p className="text-[11px] text-amber-700">Ditolak.</p> : null}
      {!approveState?.ok && approveState?.error?.message ? (
        <p className="max-w-[220px] text-right text-[11px] text-destructive">{approveState.error.message}</p>
      ) : null}
      {!rejectState?.ok && rejectState?.error?.message ? (
        <p className="max-w-[220px] text-right text-[11px] text-destructive">{rejectState.error.message}</p>
      ) : null}
    </div>
  );
}
