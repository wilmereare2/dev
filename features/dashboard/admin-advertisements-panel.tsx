"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AD_PLACEMENT_KEYS, getPlacementLabel } from "@/lib/ads/placements";

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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterPlacement !== "all") params.set("placement", filterPlacement);
    if (query.trim()) params.set("q", query.trim());

    const response = await fetch(`/api/admin/advertisements?${params.toString()}`);
    const payload = (await response.json()) as { items?: AdvertisementRow[] };
    setItems(payload.items ?? []);
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
      const formData = new FormData();
      formData.append("image", file);
      formData.append("variant", variant);
      const response = await fetch("/api/admin/advertisements/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Upload failed.");
        return;
      }
      setForm((current) => ({
        ...current,
        ...(variant === "default"
          ? { imageUrl: payload.url! }
          : variant === "tablet"
            ? { imageUrlTablet: payload.url! }
            : { imageUrlMobile: payload.url! }),
      }));
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function saveForm(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      priority: Number(form.priority) || 0,
      startAt: fromLocalInput(form.startAt),
      endAt: fromLocalInput(form.endAt),
      altText: form.altText || null,
    };

    const response = await fetch(
      editingId ? `/api/admin/advertisements/${editingId}` : "/api/admin/advertisements",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Could not save advertisement.");
      setSaving(false);
      return;
    }

    setFormOpen(false);
    setSaving(false);
    void load();
  }

  async function quickAction(id: string, action: "activate" | "pause" | "archive" | "draft") {
    await fetch(`/api/admin/advertisements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    void load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this advertisement permanently?")) return;
    await fetch(`/api/admin/advertisements/${id}`, { method: "DELETE" });
    void load();
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
                  <td className="px-4 py-3 text-muted-foreground">{getPlacementLabel(row.placement)}</td>
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
                        <Button type="button" size="sm" variant="secondary" onClick={() => void quickAction(row.id, "activate")}>
                          Activate
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="secondary" onClick={() => void quickAction(row.id, "pause")}>
                          Pause
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="ghost" onClick={() => void remove(row.id)}>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form
            onSubmit={saveForm}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold">{editingId ? "Edit advertisement" : "New advertisement"}</h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                      {getPlacementLabel(key)}
                    </option>
                  ))}
                </select>
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
                <div key={variant} className="flex flex-wrap items-center gap-3">
                  <label className="text-sm">
                    <span className="mb-1 block text-muted-foreground">{label}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadImage(file, variant);
                      }}
                      className="text-xs"
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
                JPG, PNG, WebP, or GIF up to 5 MB. Mobile/tablet variants override the default on smaller screens.
              </p>
            </div>

            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Create advertisement"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
