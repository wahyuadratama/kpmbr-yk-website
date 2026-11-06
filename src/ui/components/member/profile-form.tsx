"use client";

import { useActionState } from "react";
import { updateMemberProfile, type UpdateMemberProfileResult } from "@/lib/actions/update-member-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FormState = UpdateMemberProfileResult;

export default function ProfileForm({
  initial,
}: {
  initial: {
    fullName: string;
    nickname: string | null;
    gender: string | null;
    phone: string | null;
    city: string | null;
    bio: string | null;
    addressDetail: string | null;
    isDirectoryVisible: boolean;
  };
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    updateMemberProfile,
    {},
  );

  const fieldError = (field: string) =>
    state?.error?.fields?.find((f) => f.field === field)?.message;

  return (
    <form action={formAction} className="space-y-4" id="profile-form">
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Profil saya</h2>
        <p className="text-sm text-muted-foreground">
          Ubah data profil pribadi. Perubahan akan ditinjau sekretariat.
        </p>

        {state?.error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/50 p-3 text-sm text-destructive">
            {state.error.message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="fullName">Nama lengkap</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={initial.fullName}
              required
              disabled={isPending}
              aria-invalid={!!fieldError("fullName")}
            />
            {fieldError("fullName") && (
              <span className="text-xs text-destructive">{fieldError("fullName")}</span>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="nickname">Nama panggilan</Label>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={initial.nickname ?? ""}
              disabled={isPending}
              placeholder="Nama panggilan"
              aria-invalid={!!fieldError("nickname")}
            />
            {fieldError("nickname") && (
              <span className="text-xs text-destructive">{fieldError("nickname")}</span>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="gender">Jenis kelamin</Label>
            <Select
              name="gender"
              defaultValue={initial.gender ?? ""}
              disabled={isPending}
              aria-invalid={!!fieldError("gender")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
              </SelectContent>
            </Select>
            {fieldError("gender") && (
              <span className="text-xs text-destructive">{fieldError("gender")}</span>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone">Nomor telepon</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={initial.phone ?? ""}
              disabled={isPending}
              placeholder="0812..."
              aria-invalid={!!fieldError("phone")}
            />
            {fieldError("phone") && (
              <span className="text-xs text-destructive">{fieldError("phone")}</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="city">Kota</Label>
          <Input
            id="city"
            name="city"
            defaultValue={initial.city ?? ""}
            disabled={isPending}
            placeholder="Kota"
            aria-invalid={!!fieldError("city")}
          />
          {fieldError("city") && (
            <span className="text-xs text-destructive">{fieldError("city")}</span>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="bio">Bio singkat</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={initial.bio ?? ""}
            disabled={isPending}
            rows={3}
            placeholder="Ceritakan sedikit tentang dirimu..."
            aria-invalid={!!fieldError("bio")}
          />
          {fieldError("bio") && (
            <span className="text-xs text-destructive">{fieldError("bio")}</span>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="addressDetail">Alamat detail</Label>
          <Textarea
            id="addressDetail"
            name="addressDetail"
            defaultValue={initial.addressDetail ?? ""}
            disabled={isPending}
            rows={3}
            placeholder="Alamat lengkap (tidak ditampilkan ke publik)"
            aria-invalid={!!fieldError("addressDetail")}
          />
          {fieldError("addressDetail") && (
            <span className="text-xs text-destructive">{fieldError("addressDetail")}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isDirectoryVisible"
            name="isDirectoryVisible"
            type="checkbox"
            defaultChecked={initial.isDirectoryVisible}
            disabled={isPending}
            className="rounded border-input bg-transparent text-[size:0.9rem] ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Label htmlFor="isDirectoryVisible" className="text-sm cursor-pointer select-none disabled:opacity-50">
            Tampilkan di direktori alumni publik
          </Label>
        </div>

        {state?.ok && (
          <p className="text-sm text-success-foreground">
            Profil berhasil diperbarui.
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}
