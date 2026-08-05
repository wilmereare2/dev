"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ContentPlayerProps = {
  contentId: string;
  slug: string;
  playbackUrl?: string;
  poster?: string;
  signedIn: boolean;
  initialProgressMs?: number;
  isPremium?: boolean;
  hasSubscription?: boolean;
};

export function ContentPlayer({
  contentId,
  slug,
  playbackUrl,
  poster,
  signedIn,
  initialProgressMs = 0,
  isPremium = false,
  hasSubscription = false,
}: ContentPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(playbackUrl ?? null);

  useEffect(() => {
    if (isPremium && !hasSubscription) {
      setResolvedUrl(null);
      return;
    }

    if (playbackUrl) {
      setResolvedUrl(playbackUrl);
      return;
    }

    void fetch(`/api/stream/playback?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.json())
      .then((payload: { playbackUrl?: string }) => setResolvedUrl(payload.playbackUrl ?? null))
      .catch(() => setResolvedUrl(null));
  }, [hasSubscription, isPremium, playbackUrl, slug]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialProgressMs) return;
    const seconds = initialProgressMs / 1000;
    const setTime = () => {
      if (video.duration && seconds < video.duration) {
        video.currentTime = seconds;
      }
    };
    video.addEventListener("loadedmetadata", setTime);
    return () => video.removeEventListener("loadedmetadata", setTime);
  }, [initialProgressMs, resolvedUrl]);

  useEffect(() => {
    if (!signedIn || !resolvedUrl) return;
    const video = videoRef.current;
    if (!video) return;

    const saveProgress = () => {
      void fetch("/api/user/watch-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          progressMs: Math.floor(video.currentTime * 1000),
        }),
      });
    };

    const interval = window.setInterval(saveProgress, 15000);
    video.addEventListener("pause", saveProgress);
    return () => {
      window.clearInterval(interval);
      video.removeEventListener("pause", saveProgress);
    };
  }, [contentId, resolvedUrl, signedIn]);

  if (isPremium && !hasSubscription) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">This title requires a premium subscription.</p>
        <Button asChild>
          <Link href="/subscriptions">View plans</Link>
        </Button>
      </div>
    );
  }

  if (!resolvedUrl) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center text-muted-foreground">
        Add a video URL or file in Sanity Studio
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-contain"
      controls
      poster={poster}
      src={resolvedUrl}
    />
  );
}
