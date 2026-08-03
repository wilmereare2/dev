"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type SanityImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string | null | undefined;
  alt: string;
  fallbackClassName?: string;
};

/**
 * Sanity CDN images use `unoptimized` to avoid Next.js image proxy failures in local dev.
 * Falls back to a gradient block if the asset 404s or fails to load.
 */
export function SanityImage({
  src,
  alt,
  className,
  fallbackClassName,
  fill,
  ...props
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
    <Image
      {...props}
      src={src}
      alt={alt}
      fill={fill}
      unoptimized
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
