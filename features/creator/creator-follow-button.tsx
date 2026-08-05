"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type CreatorFollowButtonProps = {
  creatorUserId?: string;
};

export function CreatorFollowButton({ creatorUserId }: CreatorFollowButtonProps) {
  const { data: session } = useSession();
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);

  if (!creatorUserId) {
    return (
      <Button asChild variant="secondary">
        <Link href="/contact">Follow updates</Link>
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button asChild variant="premium">
        <Link href="/account">Sign in to follow</Link>
      </Button>
    );
  }

  async function toggleFollow() {
    setPending(true);
    try {
      const response = await fetch("/api/user/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: creatorUserId }),
      });
      const payload = (await response.json()) as { following?: boolean; error?: string };
      if (response.ok) {
        setFollowing(Boolean(payload.following));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant={following ? "secondary" : "premium"} disabled={pending} onClick={toggleFollow}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
