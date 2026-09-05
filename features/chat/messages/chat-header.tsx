"use client";

import type { ReactNode } from "react";
import { ChevronLeft, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

type ChatHeaderProps = {
  title: string;
  subtitle: string;
  avatar: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  searchOpen: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  /** Opens the conversation's info panel, as clicking a Telegram header does. */
  onTitleClick?: () => void;
};

export function ChatHeader({
  title,
  subtitle,
  avatar,
  onBack,
  actions,
  searchOpen,
  searchQuery,
  onSearchToggle,
  onSearchChange,
  onSearchClear,
  onTitleClick,
}: ChatHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="shrink-0 border-b border-border/60 bg-background/50 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        {onBack ? (
          <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label={t("chat.backToConversations")}>
            <ChevronLeft className="size-5" />
          </Button>
        ) : null}

        {avatar}

        {onTitleClick ? (
          <button
            type="button"
            onClick={onTitleClick}
            className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left transition hover:bg-muted/40"
            aria-label={`${title} — group info`}
          >
            <p className="truncate text-sm font-semibold leading-tight">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={searchOpen ? t("chat.closeSearch") : t("chat.searchMessages")}
            aria-pressed={searchOpen}
            onClick={onSearchToggle}
          >
            {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
          </Button>
          {actions}
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-border/40 px-3 pb-3 pt-2 sm:px-4">
          <label htmlFor="message-search" className="sr-only">
            {t("chat.searchMessages")}
          </label>
          <input
            id="message-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("chat.searchConversation")}
            className="h-9 w-full rounded-lg border border-border bg-background/80 px-3 text-sm outline-none focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/20"
          />
        </div>
      ) : null}
    </header>
  );
}
