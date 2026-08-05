"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type SanityImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
};

/**
 * Sanity CDN images use a plain <img> to avoid Next.js Image fill-mode hydration mismatches.
 * Falls back to a gradient block if the asset 404s or fails to load.
 */
export function SanityImage({
  src,
  alt,
  className,
  fallbackClassName,
  fill,
  priority,
  width,
  height,
}: SanityImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          fill ? "absolute inset-0" : "h-full w-full",
          "bg-gradient-to-br from-accent/10 via-muted to-background",
          fallbackClassName,
          className,
        )}
        aria-hidden={!alt}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
      onError={() => setFailed(true)}
    />
  );
}
