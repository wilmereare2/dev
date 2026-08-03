"use client";

import { useEffect, useRef } from "react";
import { PatchEvent, set, type ObjectInputProps } from "sanity";
import {
  cloneCropHotspot,
  DEFAULT_CROP,
  DEFAULT_HOTSPOT,
  type CropHotspotValue,
} from "@/sanity/lib/image-crop-defaults";

const HOTSPOT_DIALOG_TITLE = "Edit hotspot and crop";
const FOOTER_ATTR = "data-manuelax-hotspot-footer";

function findHotspotDialog(): HTMLElement | null {
  for (const dialog of document.querySelectorAll('[role="dialog"]')) {
    const el = dialog as HTMLElement;
    for (const label of el.querySelectorAll('[id$="_label"]')) {
      if (label.textContent?.trim() === HOTSPOT_DIALOG_TITLE) return el;
    }
    if (el.textContent?.includes("Hotspot & Crop") && el.textContent?.includes(HOTSPOT_DIALOG_TITLE)) {
      return el;
    }
  }
  return null;
}

function closeDialog(dialog: HTMLElement) {
  (dialog.querySelector('[aria-label="Close dialog"]') as HTMLButtonElement | null)?.click();
}

function applyCropHotspot(onChange: ObjectInputProps["onChange"], next: CropHotspotValue) {
  onChange(
    PatchEvent.from([
      set({ ...DEFAULT_CROP, ...next.crop }, ["crop"]),
      set({ ...DEFAULT_HOTSPOT, ...next.hotspot }, ["hotspot"]),
    ]),
  );
}

function createFooter(
  dialog: HTMLElement,
  snapshot: CropHotspotValue,
  onChange: ObjectInputProps["onChange"],
  readOnly: boolean,
) {
  if (dialog.querySelector(`[${FOOTER_ATTR}]`)) return;

  const footer = document.createElement("div");
  footer.setAttribute(FOOTER_ATTR, "");
  footer.style.cssText =
    "display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--card-border-color);background:var(--card-bg-color);";

  const makeButton = (label: string, variant: "primary" | "ghost" | "critical") => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.disabled = readOnly;
    btn.style.cssText =
      "font:inherit;font-size:13px;font-weight:500;padding:8px 14px;border-radius:4px;cursor:pointer;" +
      (readOnly ? "opacity:0.5;cursor:not-allowed;" : "");
    if (variant === "primary") {
      btn.style.background = "var(--brand-primary-bg-color, #2276fc)";
      btn.style.color = "var(--brand-primary-fg-color, #fff)";
      btn.style.border = "none";
    } else if (variant === "critical") {
      btn.style.background = "transparent";
      btn.style.color = "var(--card-critical-fg-color, #f03e2f)";
      btn.style.border = "1px solid var(--card-border-color)";
    } else {
      btn.style.background = "transparent";
      btn.style.color = "var(--card-fg-color)";
      btn.style.border = "1px solid var(--card-border-color)";
    }
    return btn;
  };

  const resetBtn = makeButton("Reset", "critical");
  resetBtn.addEventListener("click", () => {
    applyCropHotspot(onChange, { crop: { ...DEFAULT_CROP }, hotspot: { ...DEFAULT_HOTSPOT } });
  });

  const cancelBtn = makeButton("Cancel", "ghost");
  cancelBtn.addEventListener("click", () => {
    applyCropHotspot(onChange, snapshot);
    closeDialog(dialog);
  });

  const saveBtn = makeButton("Save", "primary");
  saveBtn.addEventListener("click", () => closeDialog(dialog));

  footer.append(resetBtn, cancelBtn, saveBtn);

  const card = dialog.querySelector('[data-ui="DialogCard"]');
  if (card) {
    card.appendChild(footer);
  } else {
    dialog.appendChild(footer);
  }
}

/** Injects Save / Cancel / Reset into Sanity's built-in hotspot & crop dialog. */
export function useHotspotDialogFooter(
  value: CropHotspotValue | undefined,
  onChange: ObjectInputProps["onChange"],
  readOnly: boolean,
) {
  const snapshotRef = useRef<CropHotspotValue | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (readOnly || typeof document === "undefined") return;

    const sync = () => {
      const dialog = findHotspotDialog();
      if (!dialog) {
        snapshotRef.current = null;
        return;
      }

      if (!snapshotRef.current) {
        snapshotRef.current = cloneCropHotspot(value);
      }

      createFooter(dialog, snapshotRef.current, onChangeRef.current, readOnly);
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();

    return () => {
      observer.disconnect();
      document.querySelectorAll(`[${FOOTER_ATTR}]`).forEach((el) => el.remove());
      snapshotRef.current = null;
    };
  }, [readOnly, value]);
}
