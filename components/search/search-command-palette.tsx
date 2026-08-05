"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Hash, Search, Sparkles, User, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const RECENT_KEY = "manuelax-recent-searches";

type Suggestion = {
  id: string;
  label: string;
  href: string;
  kind: "content" | "creator" | "category" | "page";
};

type SearchCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  try {
    const next = [term, ...loadRecent().filter((entry) => entry !== term)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function kindIcon(kind: Suggestion["kind"]) {
  switch (kind) {
    case "creator":
      return User;
    case "category":
      return Hash;
    case "page":
      return Sparkles;
    default:
      return Video;
  }
}

export function SearchCommandPalette({ open, onOpenChange }: SearchCommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setRecent(loadRecent());
      setQuery("");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPending(true);
      try {
        const params = new URLSearchParams(query.trim() ? { q: query.trim() } : undefined);
        const response = await fetch(`/api/search/suggest?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as { suggestions?: Suggestion[] };
        setSuggestions(payload.suggestions ?? []);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    }, query.trim() ? 180 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, query]);

  const navigate = useCallback(
    (href: string, term?: string) => {
      if (term?.trim()) saveRecent(term.trim());
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const submitSearch = useCallback(() => {
    const term = query.trim();
    if (!term) return;
    saveRecent(term);
    onOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }, [onOpenChange, query, router]);

  const groups = useMemo(() => {
    if (query.trim()) {
      return [{ title: pending ? "Searching…" : "Results", items: suggestions }];
    }

    const recentItems: Suggestion[] = recent.map((term, index) => ({
      id: `recent-${index}-${term}`,
      label: term,
      href: `/search?q=${encodeURIComponent(term)}`,
      kind: "page" as const,
    }));

    return [
      recentItems.length ? { title: "Recent searches", items: recentItems } : null,
      { title: "Trending destinations", items: suggestions },
    ].filter(Boolean) as Array<{ title: string; items: Suggestion[] }>;
  }, [pending, query, recent, suggestions]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 py-16 backdrop-blur-sm sm:py-24">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/70 bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onOpenChange(false);
              if (event.key === "Enter") submitSearch();
            }}
            placeholder="Search creators, videos, categories…"
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {groups.map((group) => (
            <div key={group.title} className="py-2">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.id.startsWith("recent-") ? Clock : kindIcon(item.kind);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted",
                        )}
                        onClick={() => navigate(item.href, item.id.startsWith("recent-") ? item.label : query)}
                      >
                        <Icon className="size-4 shrink-0 text-accent" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {query.trim() ? (
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-between rounded-xl border border-border/60 px-3 py-2.5 text-sm transition hover:bg-muted"
              onClick={submitSearch}
            >
              <span>
                Search for <span className="font-medium text-foreground">&quot;{query.trim()}&quot;</span>
              </span>
              <ArrowRight className="size-4 text-accent" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          Press <kbd className="rounded border border-border px-1.5 py-0.5">Enter</kbd> to search the full
          catalog ·{" "}
          <Link href="/search" className="text-accent hover:underline" onClick={() => onOpenChange(false)}>
            Advanced search
          </Link>
        </div>
      </div>
    </div>
  );
}

export function useSearchCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}
