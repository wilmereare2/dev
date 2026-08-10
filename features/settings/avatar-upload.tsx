"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/user-avatar";
import {
  AVATAR_SCALE_DEFAULT,
  AVATAR_SCALE_MAX,
  AVATAR_SCALE_MIN,
  clampAvatarScale,
} from "@/lib/user/avatar";

type AvatarUploadProps = {
  initialImage?: string | null;
  initialScale?: number;
  name?: string | null;
  email?: string | null;
  disabled?: boolean;
};

export function AvatarUpload({
  initialImage,
  initialScale = AVATAR_SCALE_DEFAULT,
  name,
  email,
  disabled,
}: AvatarUploadProps) {
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(initialImage ?? null);
  const [scale, setScale] = useState(clampAvatarScale(initialScale));
  const [savedScale, setSavedScale] = useState(clampAvatarScale(initialScale));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [scalePending, setScalePending] = useState(false);

  const scaleDirty = scale !== savedScale;

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
      await update({ avatarVersion: payload.avatarVersion ?? Date.now() });
      setMessage("Avatar updated.");
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
      await update({ avatarVersion: 0 });
      setMessage("Avatar removed.");
    } catch {
      setError("Could not remove avatar.");
    } finally {
      setPending(false);
    }
  }

  async function saveScale() {
    setScalePending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/user/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarScale: scale }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not save avatar size.");
        return;
      }

      setSavedScale(scale);
      await update({ avatarScale: scale });
      setMessage("Avatar size saved.");
    } catch {
      setError("Could not save avatar size.");
    } finally {
      setScalePending(false);
    }
  }

  function resetScale() {
    setScale(savedScale);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <UserAvatar name={name} email={email} image={image} size="xl" imageScale={scale} />
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Profile photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              JPG, PNG, WebP, or GIF. Max 1 MB. Shown in the header and your account.
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

          <div className="rounded-xl border border-border/70 bg-background/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="avatar-scale" className="text-sm font-medium">
                Avatar size
              </label>
              <span className="text-sm tabular-nums text-muted-foreground">{scale}%</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Zoom your photo inside the circle. Useful when your face looks too small or too cropped.
            </p>
            <input
              id="avatar-scale"
              type="range"
              min={AVATAR_SCALE_MIN}
              max={AVATAR_SCALE_MAX}
              step={1}
              value={scale}
              disabled={disabled || !image}
              onChange={(event) => setScale(clampAvatarScale(Number(event.target.value)))}
              className="mt-3 w-full accent-accent disabled:opacity-50"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Smaller</span>
              <span>Larger</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!scaleDirty || scalePending || disabled || !image}
                onClick={() => void saveScale()}
              >
                {scalePending ? "Saving..." : "Save size"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!scaleDirty || scalePending || disabled}
                onClick={resetScale}
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {message ? <p className="text-sm text-accent">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
