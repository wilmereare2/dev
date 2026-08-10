"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, Loader2, Search, Shield, UserMinus, UserPlus, X } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import type { GroupMemberPayload, GroupMemberRole, MemberSummaryPayload } from "@/lib/chat/constants";
import { formatMemberCount } from "@/features/chat/chat-format";
import { cn } from "@/lib/utils";

type GroupMembersDialogProps = {
  open: boolean;
  groupId: string;
  groupName: string;
  myRole: GroupMemberRole;
  onClose: () => void;
  onChanged: () => void;
};

function roleLabel(role: GroupMemberRole) {
  if (role === "creator") return "Creator";
  if (role === "admin") return "Admin";
  return "Member";
}

function roleBadgeClass(role: GroupMemberRole) {
  if (role === "creator") return "border-amber-500/40 bg-amber-500/15 text-amber-400";
  if (role === "admin") return "border-indigo-500/40 bg-indigo-500/15 text-indigo-400";
  return "border-border bg-muted/40 text-muted-foreground";
}

export function GroupMembersDialog({
  open,
  groupId,
  groupName,
  myRole,
  onClose,
  onChanged,
}: GroupMembersDialogProps) {
  const [members, setMembers] = useState<GroupMemberPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [query, setQuery] = useState("");
  const [searchPending, setSearchPending] = useState(false);
  const [searchResults, setSearchResults] = useState<MemberSummaryPayload[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [invitePending, setInvitePending] = useState(false);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const canInvite = myRole === "creator" || myRole === "admin";
  const canManageRoles = myRole === "creator";
  const canRemoveMembers = myRole === "creator" || myRole === "admin";
  const memberIds = useMemo(() => new Set(members.map((member) => member.userId)), [members]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chat/groups/${groupId}/members`);
      const payload = (await response.json()) as { members?: GroupMemberPayload[]; error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not load members.");
        return;
      }
      setMembers(payload.members ?? []);
    } catch {
      setError("Could not load members.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!open) {
      setShowInvite(false);
      setQuery("");
      setSelectedIds([]);
      setError(null);
      return;
    }

    void loadMembers();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loadMembers, onClose, open]);

  useEffect(() => {
    if (!open || !showInvite) return;

    let cancelled = false;
    setSearchPending(true);

    fetch(`/api/chat/members?q=${encodeURIComponent(query)}`)
      .then((response) => response.json())
      .then((payload: { members?: MemberSummaryPayload[] }) => {
        if (cancelled) return;
        setSearchResults(payload.members ?? []);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, query, showInvite]);

  async function handleInvite() {
    if (!selectedIds.length || invitePending) return;

    setInvitePending(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: selectedIds }),
      });
      const payload = (await response.json()) as { error?: string; added?: number };

      if (!response.ok) {
        setError(payload.error ?? "Could not invite members.");
        return;
      }

      setSelectedIds([]);
      setShowInvite(false);
      setQuery("");
      await loadMembers();
      onChanged();
    } catch {
      setError("Could not invite members.");
    } finally {
      setInvitePending(false);
    }
  }

  async function updateRole(userId: string, role: "admin" | "member") {
    setActionPendingId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/chat/groups/${groupId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not update role.");
        return;
      }
      await loadMembers();
      onChanged();
    } catch {
      setError("Could not update role.");
    } finally {
      setActionPendingId(null);
    }
  }

  async function removeMember(userId: string) {
    setActionPendingId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/chat/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not remove member.");
        return;
      }
      await loadMembers();
      onChanged();
    } catch {
      setError("Could not remove member.");
    } finally {
      setActionPendingId(null);
    }
  }

  function toggleInvite(memberId: string) {
    if (memberIds.has(memberId)) return;
    setSelectedIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
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
        aria-labelledby="group-members-title"
        className="relative z-10 flex max-h-[min(85dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h2 id="group-members-title" className="text-base font-semibold">
              {groupName} members
            </h2>
            <p className="text-xs text-muted-foreground">
              Element-style roles · creator, admins, and members
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2">
          <p className="text-xs text-muted-foreground">{formatMemberCount(members.length)}</p>
          {canInvite ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowInvite((value) => !value)}>
              <UserPlus className="size-4" aria-hidden />
              Invite
            </Button>
          ) : null}
        </div>

        {error ? <p className="px-4 py-2 text-sm text-red-400">{error}</p> : null}

        {showInvite && canInvite ? (
          <div className="border-b border-border/60 px-4 py-3">
            <label htmlFor="invite-member-search" className="text-sm font-medium">
              Invite people
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="invite-member-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email…"
                className="h-10 w-full rounded-xl border border-border bg-surface/50 pl-10 pr-3 text-sm outline-none focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/20"
              />
            </div>
            {selectedIds.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{selectedIds.length} selected</p>
            ) : null}
            <div className="mt-2 max-h-40 overflow-y-auto">
              {searchPending ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Searching…
                </div>
              ) : (
                <ul>
                  {searchResults.map((member) => {
                    const alreadyInGroup = memberIds.has(member.id);
                    const selected = selectedIds.includes(member.id);
                    return (
                      <li key={member.id}>
                        <button
                          type="button"
                          disabled={alreadyInGroup}
                          onClick={() => toggleInvite(member.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-muted/40",
                            selected && "bg-accent/10",
                            alreadyInGroup && "opacity-50",
                          )}
                        >
                          <UserAvatar name={member.name} email={null} image={member.image} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{member.name ?? "Member"}</p>
                            <p className="text-xs text-muted-foreground">
                              {alreadyInGroup ? "Already in group" : member.role.toLowerCase()}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={invitePending || selectedIds.length === 0}
                onClick={() => void handleInvite()}
              >
                {invitePending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Send invites"}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Loading members…
            </div>
          ) : (
            <ul>
              {members.map((member) => {
                const pending = actionPendingId === member.userId;
                const showRemove =
                  canRemoveMembers &&
                  member.groupRole !== "creator" &&
                  (myRole === "creator" || member.groupRole === "member");

                return (
                  <li
                    key={member.userId}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-muted/30"
                  >
                    <UserAvatar name={member.name} email={null} image={member.image} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{member.name ?? "Member"}</p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            roleBadgeClass(member.groupRole),
                          )}
                        >
                          {member.groupRole === "creator" ? (
                            <Crown className="size-3" aria-hidden />
                          ) : member.groupRole === "admin" ? (
                            <Shield className="size-3" aria-hidden />
                          ) : null}
                          {roleLabel(member.groupRole)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      {canManageRoles && member.groupRole === "member" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => void updateRole(member.userId, "admin")}
                          className="h-8 px-2 text-xs"
                        >
                          Make admin
                        </Button>
                      ) : null}
                      {canManageRoles && member.groupRole === "admin" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => void updateRole(member.userId, "member")}
                          className="h-8 px-2 text-xs"
                        >
                          Remove admin
                        </Button>
                      ) : null}
                      {showRemove ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => void removeMember(member.userId)}
                          className="h-8 px-2 text-xs text-red-400 hover:text-red-300"
                          aria-label={`Remove ${member.name ?? "member"}`}
                        >
                          {pending ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : (
                            <UserMinus className="size-3.5" aria-hidden />
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
