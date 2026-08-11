"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import type { MemberSummaryPayload } from "@/lib/chat/constants";

type NewMessageDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelectMember: (memberId: string) => void;
};

export function NewMessageDialog({ open, onClose, onSelectMember }: NewMessageDialogProps) {
  const [query, setQuery] = useState("");
  const [knownMembers, setKnownMembers] = useState<MemberSummaryPayload[]>([]);
  const [memberResults, setMemberResults] = useState<MemberSummaryPayload[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setPending(true);

    Promise.all([
      fetch("/api/chat/members?known=1").then((response) => response.json()),
      fetch(`/api/chat/members?q=${encodeURIComponent(query)}`).then((response) => response.json()),
    ])
      .then(([knownPayload, searchPayload]) => {
        if (cancelled) return;
        setKnownMembers((knownPayload as { members?: MemberSummaryPayload[] }).members ?? []);
        setMemberResults((searchPayload as { members?: MemberSummaryPayload[] }).members ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setKnownMembers([]);
          setMemberResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-message-title"
        className="relative z-10 flex max-h-[min(80dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h2 id="new-message-title" className="text-base font-semibold">
              New message
            </h2>
            <p className="text-xs text-muted-foreground">Message any member on manuelaX</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="size-4" />
          </Button>
        </div>

        <div className="border-b border-border/60 px-4 py-3">
          <label htmlFor="new-message-search" className="sr-only">
            Search members
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="new-message-search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name…"
              className="h-11 w-full rounded-xl border border-border bg-surface/50 pl-10 pr-3 text-sm outline-none focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {pending ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Loading members…
            </div>
          ) : (
            <>
              {knownMembers.length > 0 ? (
                <MemberSection
                  title="People you know"
                  members={knownMembers}
                  onSelect={(memberId) => {
                    onSelectMember(memberId);
                    onClose();
                  }}
                />
              ) : null}

              <MemberSection
                title={knownMembers.length > 0 ? "All members" : "Members"}
                members={memberResults}
                onSelect={(memberId) => {
                  onSelectMember(memberId);
                  onClose();
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberSection({
  title,
  members,
  onSelect,
}: {
  title: string;
  members: MemberSummaryPayload[];
  onSelect: (memberId: string) => void;
}) {
  if (!members.length) return null;

  return (
    <div className="mb-4">
      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-1">
        {members.map((member) => (
          <li key={`${title}-${member.id}`}>
            <button
              type="button"
              onClick={() => onSelect(member.id)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-muted/40"
            >
              <UserAvatar name={member.name} email={null} image={member.image} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name ?? "Member"}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</p>
              </div>
              {member.known ? (
                <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">
                  Known
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
