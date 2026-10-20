import type { Metadata } from "next";
import { db } from "@/lib/db/prisma";
import { Role, UserStatus } from "@/generated/prisma/enums";
import {
  updateUserRoleAction,
  updateUserStatusAction,
  deleteUserAction,
} from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmActionForm } from "@/components/internal/confirm-action-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTanggalPendek } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Pengguna" };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  PENGURUS: "Pengurus",
  ANGGOTA: "Anggota",
  ALUMNI: "Alumni",
};

const STATUS_LABEL: Record<UserStatus, string> = {
  PENDING: "Menunggu",
  ACTIVE: "Aktif",
  SUSPENDED: "Disisplinkan",
  ARCHIVED: "Arsip",
};

type AdminAction = (fd: FormData) => Promise<void>;

const roleAction = updateUserRoleAction as unknown as AdminAction;
const statusAction = updateUserStatusAction as unknown as AdminAction;
const deleteAction = deleteUserAction as unknown as AdminAction;

export default async function UsersPage() {
  const users = await db.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, email: true, role: true, status: true, createdAt: true,
      member: { select: { id: true, fullName: true, memberCode: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Manajemen Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Data akun login. Perubahan role/status dicatat audit log.
        </p>
      </div>

      <section className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3">Email</th>
              <th className="p-3">Anggota</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Dibuat</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="p-3">
                <td className="font-medium">{u.email}</td>
                <td className="text-muted-foreground">
                  {u.member?.memberCode ?? u.member?.fullName ?? "—"}
                </td>
                <td>
                  <form action={roleAction} className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <div className="w-32">
                      <Select name="role" defaultValue={u.role}>
                        <SelectTrigger>
                          <SelectValue placeholder={ROLE_LABEL[u.role]} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Role).map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <input type="hidden" name="id" value={u.id} />
                    <Button type="submit" size="sm">Simpan</Button>
                  </form>
                </td>
                <td>
                  <form action={statusAction} className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <div className="w-32">
                      <Select name="status" defaultValue={u.status}>
                        <SelectTrigger>
                          <SelectValue placeholder={STATUS_LABEL[u.status]} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(UserStatus).map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <input type="hidden" name="id" value={u.id} />
                    <Button type="submit" size="sm">Simpan</Button>
                  </form>
                </td>
                <td className="text-muted-foreground">
                  {formatTanggalPendek(u.createdAt)}
                </td>
                <td className="text-right">
                  <ConfirmActionForm
                    action={deleteAction}
                    id={u.id}
                    confirmMessage={`Hapus akun ${u.email}?`}
                  >
                    Hapus
                  </ConfirmActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Belum ada pengguna.
          </div>
        )}
      </section>
    </div>
  );
}
