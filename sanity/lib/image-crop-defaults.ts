export type SanityCrop = {
  _type?: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
};

export type SanityHotspot = {
  _type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type CropHotspotValue = {
  crop?: SanityCrop;
  hotspot?: SanityHotspot;
};

export const DEFAULT_CROP: SanityCrop = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export const DEFAULT_HOTSPOT: SanityHotspot = {
  x: 0.5,
  y: 0.5,
  width: 1,
  height: 1,
};

export function cloneCropHotspot(value?: CropHotspotValue): CropHotspotValue {
  return {
    crop: { ...DEFAULT_CROP, ...value?.crop },
    hotspot: { ...DEFAULT_HOTSPOT, ...value?.hotspot },
  };
}
