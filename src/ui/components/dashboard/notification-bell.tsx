"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/ui/dropdown-menu";
import { cn } from "cn";

type NotifItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [items, setItems] = React.useState<NotifItem[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?size=8", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.ok && json.data) {
        setItems(json.data.items ?? []);
        setUnread(json.data.unreadCount ?? 0);
      }
    } catch {
      // diam: lonceng bukan fitur kritis
    }
  }, []);

  React.useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function markRead(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((c) => Math.max(0, c - 1));
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    setBusy(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifikasi" className="relative">
          <Bell aria-hidden="true" className="size-4" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-4 text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unread > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <CheckCheck className="size-3" /> Tandai semua dibaca
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Belum ada notifikasi.
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            {items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn("flex flex-col items-start gap-1 p-3", !n.isRead && "bg-muted/40")}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className={cn("text-sm leading-snug", !n.isRead && "font-medium")}>
                    {n.title}
                  </span>
                  {!n.isRead ? (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      disabled={busy}
                      className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                      title="Tandai dibaca"
                      aria-label="Tandai dibaca"
                    >
                      <Check className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                <div className="flex w-full items-center justify-between text-[11px] text-muted-foreground">
                  <span>{new Date(n.createdAt).toLocaleString("id-ID")}</span>
                  {n.link ? (
                    <Link href={n.link} className="underline hover:text-foreground" onClick={() => setOpen(false)}>
                      Buka
                    </Link>
                  ) : null}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
