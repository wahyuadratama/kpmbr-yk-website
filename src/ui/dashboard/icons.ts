"use client";

/**
 * Registry ikon dashboard.
 *
 * Ikon disimpan sebagai NAMA STRING pada konfigurasi navigasi, bukan sebagai
 * komponen React. Alasannya: komponen React tidak boleh diteruskan dari
 * Server Component ke Client Component (hanya data biasa dan Server Action
 * yang boleh).
 *
 * Berkas ini Client Component supaya bundel ikon hanya dimuat untuk dashboard.
 */
import {
  BarChart3,
  Calendar,
  FileText,
  FolderKanban,
  Home,
  Image,
  LayoutList,
  Megaphone,
  Newspaper,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const DASHBOARD_ICONS = {
  home: Home,
  news: Newspaper,
  calendar: Calendar,
  folder: FolderKanban,
  image: Image,
  file: FileText,
  list: LayoutList,
  megaphone: Megaphone,
  chart: BarChart3,
  receipt: Receipt,
  settings: Settings,
  shield: ShieldCheck,
  users: Users,
  wallet: Wallet,
} as const satisfies Record<string, LucideIcon>;

export type DashboardIconName = keyof typeof DASHBOARD_ICONS;
