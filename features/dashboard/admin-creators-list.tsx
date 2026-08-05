"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type CreatorRow = {
  userId: string;
  displayName?: string | null;
  verificationStatus: string;
  user: { name?: string | null; email: string };
};

export function AdminCreatorsList() {
  const [creators, setCreators] = useState<CreatorRow[]>([]);

  async function load() {
    const response = await fetch("/api/admin/creators");
    const payload = await response.json();
    setCreators(payload.creators ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function verify(userId: string) {
    await fetch("/api/admin/creators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "approve" }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      {creators.map((creator) => (
        <article key={creator.userId} className="rounded-2xl border border-border bg-surface/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{creator.displayName ?? creator.user.name ?? creator.user.email}</p>
              <p className="text-sm text-muted-foreground">
                {creator.verificationStatus} · {creator.user.email}
              </p>
            </div>
            {creator.verificationStatus === "pending" ? (
              <Button size="sm" onClick={() => verify(creator.userId)}>
                Verify creator
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
