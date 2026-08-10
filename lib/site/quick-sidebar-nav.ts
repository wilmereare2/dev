import type { LucideIcon } from "lucide-react";
import { Bookmark, Home, MessageSquare, Settings, Sparkles, Upload } from "lucide-react";
import type { MessageKey } from "@/lib/i18n/messages";

/** Contextual quick-access sidebar — not a duplicate of global header nav. */
export const QUICK_SIDEBAR_LINKS: { href: string; icon: LucideIcon; labelKey: MessageKey }[] = [
  { href: "/", icon: Home, labelKey: "nav.home" },
  { href: "/messages", icon: MessageSquare, labelKey: "nav.messages" },
  { href: "/library", icon: Bookmark, labelKey: "nav.library" },
  { href: "/create", icon: Upload, labelKey: "nav.create" },
  { href: "/settings/profile", icon: Settings, labelKey: "nav.settings" },
];

export const QUICK_SIDEBAR_SECONDARY: { href: string; icon: LucideIcon; labelKey: MessageKey }[] = [
  { href: "/explore", icon: Sparkles, labelKey: "nav.explore" },
];
