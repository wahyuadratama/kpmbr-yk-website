"use client";

/**
 * Formulir login.
 *
 * Komponen ini HANYA mengirim input dan menampilkan hasil. Ia tidak pernah
 * memutuskan apa pun soal akses: otorisasi seluruhnya di server
 * (`loginAction` → `authorize()` di `src/auth.ts`).
 */
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import type { ActionResult } from "@/lib/actions/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Memproses..." : "Masuk"}
    </Button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const initial: ActionResult<{ next: string }> = {
    ok: false,
    error: { code: "BAD_REQUEST", message: "" },
  };
  const [state, formAction] = useActionState<ActionResult<{ next: string }>, FormData>(
    async (_prev, formData) => loginAction(_prev, formData),
    initial,
  );

  const message = state.ok ? "" : state.error.message;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {message ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={191}
          placeholder="admin@kpmbr-yk.local"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
        />
      </div>

      <SubmitButton />
    </form>
  );
}