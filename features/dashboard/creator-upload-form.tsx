"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-accent/60";

type CategoryOption = { slug: string; title: string };

type CreatorUploadFormProps = {
  categories: CategoryOption[];
  redirectPrefix?: string;
};

export function CreatorUploadForm({ categories, redirectPrefix = "/creator-dashboard/content" }: CreatorUploadFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState("video");

  function toggleCategory(slug: string) {
    setSelectedCategories((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    if (selectedCategories.length === 0) {
      setError("Choose at least one category.");
      setPending(false);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("mediaType", mediaType);
    formData.set("categories", selectedCategories.join(","));

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (mediaType === "text" && !description) {
      setError("Text posts need a body in the description field.");
      setPending(false);
      return;
    }

    if (mediaType !== "text" && !formData.get("media") && !formData.get("mediaUrl") && !formData.get("thumbnail")) {
      setError("Add a file, media URL, or thumbnail for this upload type.");
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/creator/content", { method: "POST", body: formData });
      const payload = (await response.json()) as { error?: string; code?: string; href?: string; upload?: { id: string } };

      if (!response.ok) {
        if (payload.code === "CREATOR_REQUIRED" && payload.href) {
          setError(`${payload.error ?? "Enable creator tools first."} Redirecting...`);
          router.push(payload.href);
          return;
        }
        setError(payload.error ?? "Upload failed.");
        return;
      }

      router.push(`/creator-dashboard/content/${payload.upload?.id}`);
    } catch {
      setError("Upload failed. Check your database connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-surface/60 p-6">
      <div>
        <label className="text-sm font-medium">Title</label>
        <input name="title" required className={inputClass} placeholder="Give your upload a clear title" />
      </div>

      <div>
        <label className="text-sm font-medium">Description / text body</label>
        <textarea
          name="description"
          rows={5}
          className={`${inputClass} h-auto py-2`}
          placeholder="Describe the content, or write your full text post here"
        />
      </div>

      <div>
        <p className="text-sm font-medium">Categories (required)</p>
        <p className="mt-1 text-xs text-muted-foreground">Where should this appear when approved?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = selectedCategories.includes(category.slug);
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => toggleCategory(category.slug)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/40"
                }`}
              >
                {category.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Content type</label>
          <select
            value={mediaType}
            onChange={(event) => setMediaType(event.target.value)}
            className={inputClass}
          >
            <option value="video">Video</option>
            <option value="photo">Photo</option>
            <option value="gallery">Image gallery</option>
            <option value="gif">GIF</option>
            <option value="audio">Audio</option>
            <option value="text">Text post</option>
            <option value="preview">Preview / teaser clip</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Visibility</label>
          <select name="visibility" defaultValue="public" className={inputClass}>
            <option value="public">Public</option>
            <option value="followers">Followers only</option>
            <option value="subscribers">Subscribers only</option>
            <option value="private">Private (draft)</option>
          </select>
        </div>
      </div>

      {mediaType !== "text" ? (
        <>
          <div>
            <label className="text-sm font-medium">Thumbnail (JPEG, PNG, WebP, GIF — max 5 MB)</label>
            <input name="thumbnail" type="file" accept="image/*" className="mt-2 block w-full text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Media file (optional if URL below)</label>
            <input name="media" type="file" accept="video/*,audio/*,image/*" className="mt-2 block w-full text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Media URL (MP4, CDN, Mux — recommended for large videos)</label>
            <input name="mediaUrl" type="url" placeholder="https://" className={inputClass} />
          </div>
        </>
      ) : null}

      <div>
        <label className="text-sm font-medium">Tags (comma-separated, optional)</label>
        <input name="tags" className={inputClass} placeholder="fitness, premium, weekend" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input name="isPremium" type="checkbox" value="true" className="size-4" />
          Premium (platform subscription required)
        </label>
        <div>
          <label className="text-sm font-medium">PPV price (cents, optional)</label>
          <input name="ppvPriceCents" type="number" min={0} className={inputClass} placeholder="999 = $9.99" />
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving draft..." : "Save draft"}
        </Button>
        <p className="self-center text-xs text-muted-foreground">
          After saving, open the upload to submit for moderation review.
        </p>
      </div>
    </form>
  );
}
