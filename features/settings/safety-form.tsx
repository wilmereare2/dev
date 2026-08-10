"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";

type SafetyUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type SafetyEntry = {
  id: string;
  user: SafetyUser;
  blockedAt?: string;
  mutedAt?: string;
};

export function SafetyForm() {
  const [blocked, setBlocked] = useState<SafetyEntry[]>([]);
  const [muted, setMuted] = useState<SafetyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadLists() {
    setLoading(true);
    try {
      const [blockedResponse, mutedResponse] = await Promise.all([
        fetch("/api/user/blocks"),
        fetch("/api/user/mutes"),
      ]);
      const blockedPayload = (await blockedResponse.json()) as { items?: SafetyEntry[] };
      const mutedPayload = (await mutedResponse.json()) as { items?: SafetyEntry[] };
      setBlocked(blockedPayload.items ?? []);
      setMuted(mutedPayload.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLists();
  }, []);

  async function updateBlock(userId: string, action: "block" | "unblock") {
    setPendingId(userId);
    setMessage(null);
    try {
      const response = await fetch("/api/user/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: userId, action }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setMessage(payload.error ?? "Could not update block list.");
        return;
      }
      await loadLists();
      setMessage(action === "unblock" ? "Member unblocked." : "Member blocked.");
    } finally {
      setPendingId(null);
    }
  }

  async function updateMute(userId: string, action: "mute" | "unmute") {
    setPendingId(userId);
    setMessage(null);
    try {
      const response = await fetch("/api/user/mutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mutedId: userId, action }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setMessage(payload.error ?? "Could not update mute list.");
        return;
      }
      await loadLists();
      setMessage(action === "unmute" ? "Member unmuted." : "Member muted.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Blocked members</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Blocked members cannot send you private messages.
        </p>
        <SafetyList
          loading={loading}
          items={blocked}
          emptyLabel="You have not blocked anyone."
          actionLabel="Unblock"
          pendingId={pendingId}
          onAction={(userId) => updateBlock(userId, "unblock")}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Muted members</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Muted members can still message you, but you will not receive notifications from them.
        </p>
        <SafetyList
          loading={loading}
          items={muted}
          emptyLabel="You have not muted anyone."
          actionLabel="Unmute"
          pendingId={pendingId}
          onAction={(userId) => updateMute(userId, "unmute")}
        />
      </section>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </div>
  );
}

function SafetyList({
  loading,
  items,
  emptyLabel,
  actionLabel,
  pendingId,
  onAction,
}: {
  loading: boolean;
  items: SafetyEntry[];
  emptyLabel: string;
  actionLabel: string;
  pendingId: string | null;
  onAction: (userId: string) => void;
}) {
  if (loading) {
    return (
      <div className="mt-4 flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        Loading…
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="mt-4 rounded-2xl border border-border bg-surface/50 p-6 text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="mt-4 overflow-hidden rounded-2xl border border-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={item.user.name} email={item.user.email} image={item.user.image} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.user.name ?? "Member"}</p>
              <p className="truncate text-xs text-muted-foreground">{item.user.email}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingId === item.user.id}
            onClick={() => onAction(item.user.id)}
          >
            {pendingId === item.user.id ? <Loader2 className="size-4 animate-spin" /> : actionLabel}
          </Button>
        </li>
      ))}
    </ul>
  );
}

export async function blockMember(userId: string) {
  const response = await fetch("/api/user/blocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blockedId: userId, action: "block" }),
  });
  return response.ok;
}

export async function muteMember(userId: string) {
  const response = await fetch("/api/user/mutes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mutedId: userId, action: "mute" }),
  });
  return response.ok;
}
