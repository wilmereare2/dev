"use client";

import { useState } from "react";
import { Bookmark, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

type ContentActionsProps = {
  contentId: string;
  signedIn: boolean;
};

async function postJson(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 401) {
    window.location.href = "/account";
    return null;
  }
  return response.json();
}

export function ContentActions({ contentId, signedIn }: ContentActionsProps) {
  const [saved, setSaved] = useState(false);
  const [later, setLater] = useState(false);
  const [liked, setLiked] = useState(false);

  if (!signedIn) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={saved ? "default" : "secondary"}
        onClick={async () => {
          const result = await postJson("/api/user/bookmarks", { contentId });
          if (result) setSaved(result.saved);
        }}
      >
        <Bookmark className="size-4" />
        {saved ? "Saved" : "Favorite"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={later ? "default" : "secondary"}
        onClick={async () => {
          const result = await postJson("/api/user/watch-later", { contentId });
          if (result) setLater(result.saved);
        }}
      >
        <Clock className="size-4" />
        Watch later
      </Button>
      <Button
        type="button"
        size="sm"
        variant={liked ? "default" : "secondary"}
        onClick={async () => {
          const result = await postJson("/api/user/likes", { contentId });
          if (result) setLiked(result.liked);
        }}
      >
        <Heart className="size-4" />
        Like
      </Button>
    </div>
  );
}
