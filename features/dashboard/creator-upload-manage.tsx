"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Upload = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  visibility: string;
  moderationNotes?: string | null;
  aiModerationScore?: number | null;
};

export function CreatorUploadManage({ uploadId }: { uploadId: string }) {
  const [upload, setUpload] = useState<Upload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch(`/api/creator/content/${uploadId}`)
      .then((r) => r.json())
      .then((payload) => setUpload(payload.upload ?? null));
  }, [uploadId]);

  async function submitForReview() {
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/creator/content/${uploadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit" }),
    });
    const payload = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not submit.");
      return;
    }
    setUpload(payload.upload);
    setMessage("Submitted for moderation review.");
  }

  async function removeUpload() {
    if (!confirm("Delete this upload permanently?")) return;
    const response = await fetch(`/api/creator/content/${uploadId}`, { method: "DELETE" });
    if (response.ok) window.location.href = "/creator-dashboard/content";
  }

  if (!upload) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-2xl space-y-4 rounded-2xl border border-border bg-surface/60 p-6">
      <div>
        <h2 className="text-xl font-semibold">{upload.title}</h2>
        <p className="mt-1 text-sm capitalize text-muted-foreground">
          Status: {upload.status.replace("_", " ")} · {upload.visibility}
        </p>
      </div>
      {upload.description ? <p className="text-sm text-muted-foreground">{upload.description}</p> : null}
      {upload.aiModerationScore != null ? (
        <p className="text-sm">AI moderation score: {(upload.aiModerationScore * 100).toFixed(0)}%</p>
      ) : null}
      {upload.moderationNotes ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">{upload.moderationNotes}</p>
      ) : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {["draft", "rejected"].includes(upload.status) ? (
          <Button type="button" disabled={pending} onClick={submitForReview}>
            Submit for review
          </Button>
        ) : null}
        <Button type="button" variant="secondary" onClick={removeUpload}>
          Delete
        </Button>
      </div>
    </div>
  );
}
