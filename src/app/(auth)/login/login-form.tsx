"use client";

/**
 * Formulir login.
 *
 * Komponen ini HANYA mengirim input dan menampilkan hasil. Ia tidak pernah
 * memutuskan apa pun soal akses: otorisasi seluruhnya di server
 * (`loginAction` → `authorize()` di `src/auth.ts`).
 */
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "./actions";
import type { ActionResult } from "@/server/actions/result";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Alert, AlertDescription } from "@/ui/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full h-[45px] rounded-lg bg-[#214A83] text-white font-semibold hover:bg-[#214A83]/90 disabled:opacity-70"
      size="lg"
      disabled={pending}
    >
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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {message && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={191}
          placeholder="nama@email.com"
          className="h-[42px] rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="ml-auto p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          maxLength={200}
          className="h-[42px] rounded-lg"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
