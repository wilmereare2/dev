"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, MoreHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupMembersDialog } from "@/features/chat/group-members-dialog";
import type { GroupMemberRole } from "@/lib/chat/constants";
import { cn } from "@/lib/utils";

type GroupActionsMenuProps = {
  groupId: string;
  groupName: string;
  myRole: GroupMemberRole;
  archived: boolean;
  onArchivedChange: () => void;
  onMembersChange: () => void;
};

export function GroupActionsMenu({
  groupId,
  groupName,
  myRole,
  archived,
  onArchivedChange,
  onMembersChange,
}: GroupActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreator = myRole === "creator";

  async function setArchived(next: boolean) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: next }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not update archive status.");
        return;
      }
      setOpen(false);
      onArchivedChange();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Group actions"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <MoreHorizontal className="size-4" />
        </Button>

        {open ? (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
              {error ? <p className="px-3 py-2 text-xs text-red-400">{error}</p> : null}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setShowMembers(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted/40"
              >
                <Users className="size-4 text-accent" aria-hidden />
                Members & invites
              </button>
              {isCreator ? (
                <>
                  <p className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
                    Creator controls — archive is manual only.
                  </p>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void setArchived(!archived)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted/40",
                      pending && "opacity-60",
                    )}
                  >
                    {archived ? (
                      <>
                        <ArchiveRestore className="size-4 text-accent" aria-hidden />
                        Restore group
                      </>
                    ) : (
                      <>
                        <Archive className="size-4 text-muted-foreground" aria-hidden />
                        Archive {groupName}
                      </>
                    )}
                  </button>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      <GroupMembersDialog
        open={showMembers}
        groupId={groupId}
        groupName={groupName}
        myRole={myRole}
        onClose={() => setShowMembers(false)}
        onChanged={onMembersChange}
      />
    </>
  );
}
