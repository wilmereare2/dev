"use client";

import { X } from "lucide-react";
import { AdSlot } from "@/components/ads/ad-slot";

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

type PlaybackPayload = {
  playbackUrl?: string | null;
  embedUrl?: string | null;
  provider?: "youtube" | "vimeo" | null;
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
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(Boolean(playbackUrl));
  const [playing, setPlaying] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  useEffect(() => {
    if (isPremium && !hasSubscription) {
      setDirectUrl(null);
      setEmbedUrl(null);
      setLoading(false);
      return;
    }

    if (!playbackUrl) {
      setDirectUrl(null);
      setEmbedUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);
    setDirectUrl(null);
    setEmbedUrl(null);

    void fetch(`/api/stream/playback?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.json())
      .then((payload: PlaybackPayload) => {
        if (payload.embedUrl) {
          setEmbedUrl(payload.embedUrl);
          return;
        }
        setDirectUrl(payload.playbackUrl ?? null);
      })
      .catch(() => {
        setDirectUrl(null);
        setEmbedUrl(null);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
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
  }, [initialProgressMs, directUrl]);

  useEffect(() => {
    if (!signedIn || !directUrl) return;
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
  }, [contentId, directUrl, signedIn]);

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

  if (loading) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center text-muted-foreground">
        Loading video…
      </div>
    );
  }

  if (embedUrl) {
    return (
      <iframe
        className="h-full w-full border-0"
        src={embedUrl}
        title="Video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (!directUrl || loadError) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
        <p>{loadError ? "Could not load this video URL." : "Add a video URL or file in Sanity Studio"}</p>
        {loadError ? (
          <p className="text-xs">Use a Pexels page link, YouTube/Vimeo URL, or a direct MP4 link.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        controls
        playsInline
        poster={poster}
        src={directUrl}
        onError={() => setLoadError(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/*
        Pause/overlay ads only. They appear before playback starts and whenever
        the viewer pauses, never over a playing video, and never over the native
        controls — the bottom banner clears them.
      */}
      {!playing && !overlayDismissed ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <div className="pointer-events-auto relative">
            <button
              type="button"
              onClick={() => setOverlayDismissed(true)}
              aria-label="Dismiss advertisement"
              className="absolute -right-2 -top-2 z-10 inline-flex size-7 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white/80 backdrop-blur hover:text-white"
            >
              <X className="size-3.5" aria-hidden />
            </button>
            <AdSlot placement="video_overlay" collapseWhenEmpty />
          </div>
        </div>
      ) : null}

      {!playing ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center px-4">
          <div className="pointer-events-auto">
            <AdSlot placement="video_bottom" collapseWhenEmpty />
          </div>
        </div>
      ) : null}
    </div>
  );
}
