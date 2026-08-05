"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Comment = {
  id: string;
  body: string;
  approved: boolean;
  createdAt: string;
  user?: { name?: string | null };
};

export function ContentComments({ contentId }: { contentId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch(`/api/content/${contentId}/comments`);
    const payload = await response.json();
    setComments(payload.comments ?? []);
  }

  useEffect(() => {
    void load();
  }, [contentId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch(`/api/content/${contentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const payload = await response.json();
    if (response.ok) {
      setBody("");
      setMessage(payload.message ?? "Comment submitted.");
      await load();
    }
  }

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">Comments</h2>
      <form onSubmit={submit} className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          placeholder="Add a comment..."
          required
        />
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <Button type="submit" size="sm">
          Post comment
        </Button>
      </form>
      <ul className="space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-xl border border-border px-4 py-3 text-sm">
            <p className="font-medium">{comment.user?.name ?? "Member"}</p>
            <p className="mt-1 text-muted-foreground">{comment.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
