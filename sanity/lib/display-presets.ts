export type DisplayScreenId = "mobile" | "tablet" | "desktop" | "hero" | "og" | "thumb";

export type DisplayScreenPreset = {
  id: DisplayScreenId;
  label: string;
  width: number;
  height: number;
  previewWidth: number;
};

/** Output + preview sizes for common website breakpoints. */
export const DISPLAY_SCREEN_PRESETS: DisplayScreenPreset[] = [
  { id: "mobile", label: "Mobile", width: 390, height: 844, previewWidth: 108 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024, previewWidth: 140 },
  { id: "desktop", label: "Desktop", width: 1280, height: 800, previewWidth: 180 },
  { id: "hero", label: "Hero banner", width: 1600, height: 900, previewWidth: 200 },
  { id: "og", label: "Social / OG", width: 1200, height: 630, previewWidth: 180 },
  { id: "thumb", label: "Content card", width: 640, height: 400, previewWidth: 128 },
];

export function getDisplayPreset(id?: string) {
  return DISPLAY_SCREEN_PRESETS.find((p) => p.id === id) ?? DISPLAY_SCREEN_PRESETS[3];
}
