"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Users, X } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import type { GroupVisibility, MemberSummaryPayload } from "@/lib/chat/constants";
import { cn } from "@/lib/utils";

type CreateGroupDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (groupId: string) => void;
};

const EMPTY_FORM = {
  name: "",
  description: "",
  query: "",
  selectedIds: [] as string[],
  visibility: "private" as GroupVisibility,
};

export function CreateGroupDialog({ open, onClose, onCreated }: CreateGroupDialogProps) {
  const [name, setName] = useState(EMPTY_FORM.name);
  const [description, setDescription] = useState(EMPTY_FORM.description);
  const [query, setQuery] = useState(EMPTY_FORM.query);
  const [visibility, setVisibility] = useState<GroupVisibility>(EMPTY_FORM.visibility);
  const [memberResults, setMemberResults] = useState<MemberSummaryPayload[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(EMPTY_FORM.selectedIds);
  const [pending, setPending] = useState(false);
  const [searchPending, setSearchPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMembers = useMemo(() => {
    const map = new Map(memberResults.map((member) => [member.id, member]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as MemberSummaryPayload[];
  }, [memberResults, selectedIds]);

  function resetForm() {
    setName(EMPTY_FORM.name);
    setDescription(EMPTY_FORM.description);
    setQuery(EMPTY_FORM.query);
    setVisibility(EMPTY_FORM.visibility);
    setSelectedIds([]);
    setError(null);
  }

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setSearchPending(true);

    fetch(`/api/chat/members?q=${encodeURIComponent(query)}&verified=1`)
      .then((response) => response.json())
      .then((payload: { members?: MemberSummaryPayload[] }) => {
        if (cancelled) return;
        setMemberResults(payload.members ?? []);
      })
      .catch(() => {
        if (!cancelled) setMemberResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, query]);

  function toggleMember(memberId: string) {
    setSelectedIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description.trim() || null,
          memberIds: selectedIds,
          visibility,
        }),
      });
      const payload = (await response.json()) as { group?: { id: string }; error?: string };

      if (!response.ok || !payload.group) {
        setError(payload.error ?? "Could not create group.");
        return;
      }

      onCreated(payload.group.id);
      onClose();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

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
        aria-labelledby="create-group-title"
        className="relative z-10 flex max-h-[min(85dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h2 id="create-group-title" className="text-base font-semibold">
              Create group
            </h2>
            <p className="text-xs text-muted-foreground">Choose access, invite members, then save</p>
            <p className="text-[11px] text-muted-foreground">You become the group creator automatically</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 border-b border-border/60 px-4 py-4">
            <div>
              <label htmlFor="group-name" className="text-sm font-medium">
                Group name
              </label>
              <input
                id="group-name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Weekend crew, VIP lounge…"
                className="mt-2 h-11 w-full rounded-xl border border-border bg-surface/50 px-3 text-sm outline-none focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/20"
              />
            </div>
            <div>
              <label htmlFor="group-description" className="text-sm font-medium">
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="group-description"
                rows={2}
                maxLength={280}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this group about?"
                className="mt-2 w-full rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm outline-none focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/20"
              />
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Access</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label
                  className={cn(
                    "cursor-pointer rounded-xl border px-3 py-3 text-sm transition",
                    visibility === "private"
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface/40 hover:border-accent/30",
                  )}
                >
                  <input
                    type="radio"
                    name="group-visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    className="sr-only"
                  />
                  <span className="font-medium">Private</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Invite-only. Only members you add can join.
                  </span>
                </label>
                <label
                  className={cn(
                    "cursor-pointer rounded-xl border px-3 py-3 text-sm transition",
                    visibility === "public"
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface/40 hover:border-accent/30",
                  )}
                >
                  <input
                    type="radio"
                    name="group-visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="sr-only"
                  />
                  <span className="font-medium">Public</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Any member can discover and join this group.
                  </span>
                </label>
              </div>
            </fieldset>
          </div>

          <div className="border-b border-border/60 px-4 py-3">
            <label htmlFor="group-member-search" className="text-sm font-medium">
              Add members
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Search by name or @username. Only members with a verified email address can be added,
              and email addresses are never shown.
            </p>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="group-member-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name…"
                className="h-11 w-full rounded-xl border border-border bg-surface/50 pl-10 pr-3 text-sm outline-none focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/20"
              />
            </div>
            {selectedMembers.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-medium text-foreground"
                  >
                    {member.displayName ?? member.name ?? "Member"}
                    <X className="size-3" aria-hidden />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {searchPending ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Loading members…
              </div>
            ) : memberResults.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">No members found.</p>
            ) : (
              <ul>
                {memberResults.map((member) => {
                  const selected = selectedIds.includes(member.id);
                  return (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => toggleMember(member.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-muted/40",
                          selected && "bg-accent/10",
                        )}
                      >
                        <UserAvatar name={member.name} email={null} image={member.image} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{member.displayName ?? member.name ?? "Member"}</p>
                          <p className="truncate text-xs capitalize text-muted-foreground">
                            {member.role.toLowerCase()}
                          </p>
                        </div>
                        {selected ? (
                          <span className="text-xs font-semibold text-accent">Added</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border/60 px-4 py-3">
            {error ? <p className="mb-2 text-sm text-red-400">{error}</p> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={pending}>
                Reset
              </Button>
              <Button type="submit" disabled={pending || name.trim().length < 2}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save group"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
