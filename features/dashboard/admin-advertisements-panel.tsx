"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AD_PLACEMENT_KEYS,
  AD_PLACEMENTS,
  getPlacementLabel,
  getPlacementSizeLabel,
} from "@/lib/ads/placements";
import { requestJson } from "@/lib/api/client";
import { prepareBannerFile } from "@/lib/ads/prepare-banner";

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-accent/60";

type AdvertisementRow = {
  id: string;
  title: string;
  advertiserName: string;
  destinationUrl: string;
  placement: string;
  status: string;
  effectiveStatus: string;
  priority: number;
  startAt: string | null;
  endAt: string | null;
  imageUrl: string | null;
  imageUrlTablet: string | null;
  imageUrlMobile: string | null;
  altText: string | null;
  impressions: number;
  clicks: number;
  ctr: string;
};

type FormState = {
  title: string;
  advertiserName: string;
  destinationUrl: string;
  placement: string;
  status: string;
  priority: number;
  startAt: string;
  endAt: string;
  altText: string;
  imageUrl: string | null;
  imageUrlTablet: string | null;
  imageUrlMobile: string | null;
};

const emptyForm = (): FormState => ({
  title: "",
  advertiserName: "",
  destinationUrl: "https://",
  placement: AD_PLACEMENT_KEYS[0],
  status: "draft",
  priority: 0,
  startAt: "",
  endAt: "",
  altText: "",
  imageUrl: null,
  imageUrlTablet: null,
  imageUrlMobile: null,
});

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    draft: "bg-muted text-muted-foreground",
    paused: "bg-amber-500/15 text-amber-400",
    archived: "bg-muted text-muted-foreground line-through",
    expired: "bg-rose-500/15 text-rose-400",
    scheduled: "bg-sky-500/15 text-sky-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}

export function AdminAdvertisementsPanel() {
  const [items, setItems] = useState<AdvertisementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlacement, setFilterPlacement] = useState("all");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterPlacement !== "all") params.set("placement", filterPlacement);
    if (query.trim()) params.set("q", query.trim());

    const result = await requestJson<{ items?: AdvertisementRow[] }>(
      `/api/admin/advertisements?${params.toString()}`,
    );

    if (result.ok) {
      setItems(result.data.items ?? []);
      setError(null);
    } else {
      setItems([]);
      setError(result.error);
    }
    setLoading(false);
  }, [filterPlacement, filterStatus, query]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setFormOpen(true);
  }

  function openEdit(row: AdvertisementRow) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      advertiserName: row.advertiserName,
      destinationUrl: row.destinationUrl,
      placement: row.placement,
      status: row.status,
      priority: row.priority,
      startAt: toLocalInput(row.startAt),
      endAt: toLocalInput(row.endAt),
      altText: row.altText ?? "",
      imageUrl: row.imageUrl,
      imageUrlTablet: row.imageUrlTablet,
      imageUrlMobile: row.imageUrlMobile,
    });
    setError(null);
    setFormOpen(true);
  }

  async function uploadImage(file: File, variant: "default" | "tablet" | "mobile") {
    setUploading(variant);
    setError(null);
    try {
      const prepared = await prepareBannerFile(file);

      const formData = new FormData();
      formData.append("image", prepared);
      formData.append("variant", variant);

      const result = await requestJson<{ url?: string }>("/api/admin/advertisements/upload", {
        method: "POST",
        body: formData,
        timeoutMs: 60_000,
      });

      if (!result.ok || !result.data.url) {
        setError(result.ok ? "Upload failed." : result.error);
        return;
      }

      const url = result.data.url;
      setForm((current) => ({
        ...current,
        ...(variant === "default"
          ? { imageUrl: url }
          : variant === "tablet"
            ? { imageUrlTablet: url }
            : { imageUrlMobile: url }),
      }));
    } finally {
      setUploading(null);
    }
  }

  async function saveForm(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        priority: Number(form.priority) || 0,
        startAt: fromLocalInput(form.startAt),
        endAt: fromLocalInput(form.endAt),
        altText: form.altText || null,
      };

      const result = await requestJson(
        editingId ? `/api/admin/advertisements/${editingId}` : "/api/admin/advertisements",
        {
          method: editingId ? "PATCH" : "POST",
          body: payload,
        },
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setFormOpen(false);
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function quickAction(id: string, action: "activate" | "pause" | "archive" | "draft") {
    setPendingId(id);
    setError(null);
    try {
      const result = await requestJson(`/api/admin/advertisements/${id}`, {
        method: "PATCH",
        body: { action },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      void load();
    } finally {
      setPendingId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this advertisement permanently?")) return;

    setPendingId(id);
    setError(null);
    try {
      const result = await requestJson(`/api/admin/advertisements/${id}`, { method: "DELETE" });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      void load();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Advertisements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, schedule, and manage platform ads by placement slot. Pages load ads dynamically — nothing is
            hard-coded.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          New advertisement
        </Button>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label className="min-w-[180px] flex-1 text-sm">
          <span className="mb-1 block text-muted-foreground">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title or advertiser"
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Status</span>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputClass}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Placement</span>
          <select value={filterPlacement} onChange={(e) => setFilterPlacement(e.target.value)} className={inputClass}>
            <option value="all">All placements</option>
            {AD_PLACEMENT_KEYS.map((key) => (
              <option key={key} value={key}>
                {getPlacementLabel(key)}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" size="sm" variant="secondary">
          Filter
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading advertisements…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No advertisements yet. Create one to start serving ads on the site.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface/60">
              <tr>
                <th className="px-4 py-3">Advertisement</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Impressions</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.advertiserName}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{getPlacementLabel(row.placement)}</p>
                    <p className="text-xs opacity-70">{getPlacementSizeLabel(row.placement)}</p>
                  </td>
                  <td className="px-4 py-3">{statusBadge(row.effectiveStatus)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.startAt ? new Date(row.startAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.endAt ? new Date(row.endAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">{row.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3">{row.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3">{row.ctr}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(row)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      {row.status !== "active" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pendingId === row.id}
                          onClick={() => void quickAction(row.id, "activate")}
                        >
                          {pendingId === row.id ? "…" : "Activate"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pendingId === row.id}
                          onClick={() => void quickAction(row.id, "pause")}
                        >
                          {pendingId === row.id ? "…" : "Pause"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pendingId === row.id}
                        onClick={() => void remove(row.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
          <form
            onSubmit={saveForm}
            className="flex max-h-[100dvh] w-full max-w-2xl flex-col rounded-t-2xl border border-border bg-background shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
          >
            {/* Header and actions stay pinned so Save is reachable without
                scrolling to the bottom of a long form. */}
            <div className="shrink-0 border-b border-border/60 px-5 py-4 sm:px-6">
              <h3 className="text-lg font-semibold">{editingId ? "Edit advertisement" : "New advertisement"}</h3>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">Title</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">Advertiser / company</span>
                <input
                  required
                  value={form.advertiserName}
                  onChange={(e) => setForm({ ...form, advertiserName: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">Destination URL</span>
                <input
                  required
                  type="url"
                  value={form.destinationUrl}
                  onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://example.com"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Placement</span>
                <select
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  className={inputClass}
                >
                  {AD_PLACEMENT_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {getPlacementLabel(key)} — {getPlacementSizeLabel(key)}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {AD_PLACEMENTS[form.placement as keyof typeof AD_PLACEMENTS]?.description}
                </span>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Priority (0–100)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Start date</span>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">End date</span>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">Alt text (accessibility)</span>
                <input
                  value={form.altText}
                  onChange={(e) => setForm({ ...form, altText: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-border/60 p-4">
              <p className="text-sm font-medium">Banner images</p>
              {(
                [
                  ["default", "Desktop / default", form.imageUrl],
                  ["tablet", "Tablet (optional)", form.imageUrlTablet],
                  ["mobile", "Mobile (optional)", form.imageUrlMobile],
                ] as const
              ).map(([variant, label, preview]) => (
                // Native file inputs render the filename inline, so the row is
                // width-constrained to stop it pushing past the dialog edge.
                <div key={variant} className="flex flex-wrap items-center gap-3">
                  <label className="min-w-0 flex-1 text-sm">
                    <span className="mb-1 block text-muted-foreground">{label}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploading !== null}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadImage(file, variant);
                      }}
                      className="block w-full max-w-full text-xs"
                    />
                  </label>
                  {uploading === variant ? <Loader2 className="size-4 animate-spin" /> : null}
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="" className="h-12 w-20 rounded border border-border object-cover" />
                  ) : null}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Recommended size for this placement:{" "}
                <span className="font-medium text-foreground">{getPlacementSizeLabel(form.placement)}</span>. JPG,
                PNG, WebP, or GIF up to 5 MB — larger images are downscaled before upload. Mobile/tablet variants
                override the default on smaller screens.
              </p>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            </div>

            <div className="shrink-0 border-t border-border/60 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || uploading !== null}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Create advertisement"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
