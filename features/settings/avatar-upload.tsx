"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/user-avatar";
import { AvatarFocusEditor } from "@/features/settings/avatar-focus-editor";
import {
  AVATAR_FOCUS_DEFAULT,
  AVATAR_FOCUS_MAX,
  AVATAR_FOCUS_MIN,
  AVATAR_SCALE_DEFAULT,
  AVATAR_SCALE_MAX,
  AVATAR_SCALE_MIN,
  clampAvatarFocus,
  clampAvatarScale,
  normalizeAvatarFraming,
  type AvatarFraming,
} from "@/lib/user/avatar";

type AvatarUploadProps = {
  initialImage?: string | null;
  initialScale?: number;
  initialFocusX?: number;
  initialFocusY?: number;
  name?: string | null;
  email?: string | null;
  disabled?: boolean;
};

function framingEquals(a: AvatarFraming, b: AvatarFraming) {
  return a.scale === b.scale && a.focusX === b.focusX && a.focusY === b.focusY;
}

export function AvatarUpload({
  initialImage,
  initialScale = AVATAR_SCALE_DEFAULT,
  initialFocusX = AVATAR_FOCUS_DEFAULT,
  initialFocusY = AVATAR_FOCUS_DEFAULT,
  name,
  email,
  disabled,
}: AvatarUploadProps) {
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(initialImage ?? null);
  const [framing, setFraming] = useState<AvatarFraming>(
    normalizeAvatarFraming({ scale: initialScale, focusX: initialFocusX, focusY: initialFocusY }),
  );
  const [savedFraming, setSavedFraming] = useState<AvatarFraming>(
    normalizeAvatarFraming({ scale: initialScale, focusX: initialFocusX, focusY: initialFocusY }),
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [framingPending, setFramingPending] = useState(false);

  const framingDirty = !framingEquals(framing, savedFraming);

  function patchFraming(next: Partial<AvatarFraming>) {
    setFraming((current) => normalizeAvatarFraming({ ...current, ...next }));
  }

  async function uploadFile(file: File) {
    setPending(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        image?: string;
        avatarVersion?: number;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not upload avatar.");
        return;
      }

      setImage(payload.image ?? null);
      const resetFraming = normalizeAvatarFraming({});
      setFraming(resetFraming);
      setSavedFraming(resetFraming);
      await update({
        avatarVersion: payload.avatarVersion ?? Date.now(),
        avatarScale: resetFraming.scale,
        avatarFocusX: resetFraming.focusX,
        avatarFocusY: resetFraming.focusY,
      });
      setMessage("Avatar updated. Drag the photo to center your face.");
    } catch {
      setError("Could not upload avatar.");
    } finally {
      setPending(false);
    }
  }

  async function removeAvatar() {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/user/avatar", { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not remove avatar.");
        return;
      }

      setImage(null);
      const resetFraming = normalizeAvatarFraming({});
      setFraming(resetFraming);
      setSavedFraming(resetFraming);
      await update({ avatarVersion: 0, avatarScale: 100, avatarFocusX: 0, avatarFocusY: 0 });
      setMessage("Avatar removed.");
    } catch {
      setError("Could not remove avatar.");
    } finally {
      setPending(false);
    }
  }

  async function saveFraming() {
    setFramingPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/user/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarScale: framing.scale,
          avatarFocusX: framing.focusX,
          avatarFocusY: framing.focusY,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not save avatar framing.");
        return;
      }

      setSavedFraming(framing);
      await update({
        avatarScale: framing.scale,
        avatarFocusX: framing.focusX,
        avatarFocusY: framing.focusY,
      });
      setMessage("Avatar framing saved.");
    } catch {
      setError("Could not save avatar framing.");
    } finally {
      setFramingPending(false);
    }
  }

  function resetFraming() {
    setFraming(savedFraming);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {image ? (
          <AvatarFocusEditor
            image={image}
            name={name}
            email={email}
            framing={framing}
            onFramingChange={patchFraming}
            disabled={disabled || pending}
          />
        ) : (
          <UserAvatar name={name} email={email} image={null} size="xl" className="size-28 sm:size-32" />
        )}

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Profile photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              JPG, PNG, WebP, or GIF. Max 1 MB. Drag to focus your face, then save.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending || disabled}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="size-4" />
              {pending ? "Uploading..." : "Upload photo"}
            </Button>
            {image ? (
              <Button type="button" size="sm" variant="secondary" disabled={pending || disabled} onClick={removeAvatar}>
                <Trash2 className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={["image/jpeg", "image/png", "image/webp", "image/gif"].join(",")}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void uploadFile(file);
            }}
          />

          {image ? (
            <div className="space-y-4 rounded-xl border border-border/70 bg-background/40 p-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="avatar-scale" className="text-sm font-medium">
                    Zoom
                  </label>
                  <span className="text-sm tabular-nums text-muted-foreground">{framing.scale}%</span>
                </div>
                <input
                  id="avatar-scale"
                  type="range"
                  min={AVATAR_SCALE_MIN}
                  max={AVATAR_SCALE_MAX}
                  step={1}
                  value={framing.scale}
                  disabled={disabled}
                  onChange={(event) => patchFraming({ scale: clampAvatarScale(Number(event.target.value)) })}
                  className="mt-3 w-full accent-accent disabled:opacity-50"
                />
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Smaller</span>
                  <span>Larger</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="avatar-focus-y" className="text-sm font-medium">
                    Vertical position
                  </label>
                  <span className="text-sm tabular-nums text-muted-foreground">{framing.focusY}</span>
                </div>
                <input
                  id="avatar-focus-y"
                  type="range"
                  min={AVATAR_FOCUS_MIN}
                  max={AVATAR_FOCUS_MAX}
                  step={1}
                  value={framing.focusY}
                  disabled={disabled}
                  onChange={(event) => patchFraming({ focusY: clampAvatarFocus(Number(event.target.value)) })}
                  className="mt-3 w-full accent-accent disabled:opacity-50"
                />
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Show lower</span>
                  <span>Show upper</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="avatar-focus-x" className="text-sm font-medium">
                    Horizontal position
                  </label>
                  <span className="text-sm tabular-nums text-muted-foreground">{framing.focusX}</span>
                </div>
                <input
                  id="avatar-focus-x"
                  type="range"
                  min={AVATAR_FOCUS_MIN}
                  max={AVATAR_FOCUS_MAX}
                  step={1}
                  value={framing.focusX}
                  disabled={disabled}
                  onChange={(event) => patchFraming({ focusX: clampAvatarFocus(Number(event.target.value)) })}
                  className="mt-3 w-full accent-accent disabled:opacity-50"
                />
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Show right</span>
                  <span>Show left</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!framingDirty || framingPending || disabled}
                  onClick={() => void saveFraming()}
                >
                  {framingPending ? "Saving..." : "Save framing"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!framingDirty || framingPending || disabled}
                  onClick={resetFraming}
                >
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {message ? <p className="text-sm text-accent">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
