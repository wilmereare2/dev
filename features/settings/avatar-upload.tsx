"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/user-avatar";

type AvatarUploadProps = {
  initialImage?: string | null;
  name?: string | null;
  email?: string | null;
  disabled?: boolean;
};

export function AvatarUpload({ initialImage, name, email, disabled }: AvatarUploadProps) {
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(initialImage ?? null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <UserAvatar name={name} email={email} image={image} size="xl" />
        <div className="space-y-3">
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
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {message ? <p className="text-sm text-accent">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
