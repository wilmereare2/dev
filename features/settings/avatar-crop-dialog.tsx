"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEWPORT_SIZE = 280;
const OUTPUT_SIZE = 384;

type AvatarCropDialogProps = {
  file: File | null;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
};

type LoadedImage = {
  src: string;
  width: number;
  height: number;
};

export function AvatarCropDialog({ file, onClose, onConfirm }: AvatarCropDialogProps) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setImage(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setError(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setImage({ src: url, width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => {
      setError("Could not load this image.");
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [file, onClose]);

  const baseScale = image
    ? Math.max(VIEWPORT_SIZE / image.width, VIEWPORT_SIZE / image.height)
    : 1;

  const renderScale = baseScale * zoom;
  const renderWidth = image ? image.width * renderScale : 0;
  const renderHeight = image ? image.height * renderScale : 0;

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!image) return;
      dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [image, offset.x, offset.y],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (event.clientX - dragRef.current.x),
      y: dragRef.current.oy + (event.clientY - dragRef.current.y),
    });
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  async function handleConfirm() {
    if (!image || pending) return;
    setPending(true);
    setError(null);

    try {
      const blob = await exportCroppedAvatar(image, renderScale, offset);
      await onConfirm(blob);
      onClose();
    } catch {
      setError("Could not prepare avatar. Try another photo.");
    } finally {
      setPending(false);
    }
  }

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h2 id="avatar-crop-title" className="text-base font-semibold">
              Choose your avatar
            </h2>
            <p className="text-xs text-muted-foreground">Drag and zoom to frame the part you want</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center px-4 py-5">
          <div
            className={cn(
              "relative touch-none overflow-hidden rounded-full bg-muted ring-2 ring-accent/40",
              !image && "animate-pulse",
            )}
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.src}
                alt=""
                draggable={false}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: renderWidth,
                  height: renderHeight,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden />
              </div>
            )}
          </div>

          <div className="mt-5 w-full">
            <div className="flex items-center gap-2">
              <ZoomIn className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                disabled={!image || pending}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-accent"
                aria-label="Zoom photo"
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              The full photo is uploaded only to crop your avatar on this device.
            </p>
          </div>
        </div>

        {error ? <p className="px-4 pb-2 text-sm text-red-500">{error}</p> : null}

        <div className="flex justify-end gap-2 border-t border-border/60 px-4 py-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={!image || pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Use this avatar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function exportCroppedAvatar(
  image: LoadedImage,
  renderScale: number,
  offset: { x: number; y: number },
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }

      const ratio = OUTPUT_SIZE / VIEWPORT_SIZE;
      const drawWidth = image.width * renderScale * ratio;
      const drawHeight = image.height * renderScale * ratio;
      const drawX = OUTPUT_SIZE / 2 - drawWidth / 2 + offset.x * ratio;
      const drawY = OUTPUT_SIZE / 2 - drawHeight / 2 + offset.y * ratio;

      ctx.beginPath();
      ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Export failed"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = image.src;
  });
}
