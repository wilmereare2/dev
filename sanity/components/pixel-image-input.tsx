"use client";

import { useEffect, useMemo, useState } from "react";
import { createImageUrlBuilder } from "@sanity/image-url";
import { Box, Button, Card, Flex, Label, Stack, Text, TextInput } from "@sanity/ui";
import { PatchEvent, set, unset, useClient, useDataset, useProjectId, type ObjectInputProps } from "sanity";
import {
  DISPLAY_SCREEN_PRESETS,
  getDisplayPreset,
  type DisplayScreenId,
} from "@/sanity/lib/display-presets";
import { useHotspotDialogFooter } from "@/sanity/components/hotspot-dialog-footer";

type ImageDimensions = { width: number; height: number };

type ImageValue = {
  asset?: { _ref?: string };
  crop?: { top?: number; left?: number; right?: number; bottom?: number };
  hotspot?: { x?: number; y?: number; width?: number; height?: number };
  outputWidth?: number;
  outputHeight?: number;
  displayScreen?: DisplayScreenId;
};

function parsePx(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function cropToPixels(crop: ImageValue["crop"], natural: ImageDimensions) {
  const left = crop?.left ?? 0;
  const top = crop?.top ?? 0;
  const right = crop?.right ?? 0;
  const bottom = crop?.bottom ?? 0;
  return {
    left: Math.round(left * natural.width),
    top: Math.round(top * natural.height),
    width: Math.round((1 - left - right) * natural.width),
    height: Math.round((1 - top - bottom) * natural.height),
  };
}

function pixelsToCrop(
  pixels: { left: number; top: number; width: number; height: number },
  natural: ImageDimensions,
) {
  const left = Math.max(0, Math.min(pixels.left, natural.width));
  const top = Math.max(0, Math.min(pixels.top, natural.height));
  const width = Math.max(1, Math.min(pixels.width, natural.width - left));
  const height = Math.max(1, Math.min(pixels.height, natural.height - top));

  return {
    left: left / natural.width,
    top: top / natural.height,
    right: (natural.width - left - width) / natural.width,
    bottom: (natural.height - top - height) / natural.height,
  };
}

function hotspotToPixels(hotspot: ImageValue["hotspot"], natural: ImageDimensions) {
  const x = hotspot?.x ?? 0.5;
  const y = hotspot?.y ?? 0.5;
  const w = hotspot?.width ?? 1;
  const h = hotspot?.height ?? 1;
  return {
    centerX: Math.round(x * natural.width),
    centerY: Math.round(y * natural.height),
    width: Math.round(w * natural.width),
    height: Math.round(h * natural.height),
  };
}

function pixelsToHotspot(
  pixels: { centerX: number; centerY: number; width: number; height: number },
  natural: ImageDimensions,
) {
  const centerX = Math.max(0, Math.min(pixels.centerX, natural.width));
  const centerY = Math.max(0, Math.min(pixels.centerY, natural.height));
  const width = Math.max(1, Math.min(pixels.width, natural.width));
  const height = Math.max(1, Math.min(pixels.height, natural.height));

  return {
    x: centerX / natural.width,
    y: centerY / natural.height,
    width: width / natural.width,
    height: height / natural.height,
  };
}

function NumberField({
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: number | undefined;
  placeholder?: string;
  disabled?: boolean;
  onChange: (raw: string) => void;
}) {
  return (
    <Box flex={1} style={{ minWidth: 120 }}>
      <Label size={0}>{label}</Label>
      <TextInput
        type="number"
        min={0}
        disabled={disabled}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </Box>
  );
}

function switchToDraftPerspective() {
  const url = new URL(window.location.href);
  url.searchParams.delete("perspective");
  window.location.href = url.toString();
}

/** Wraps Sanity image input with pixel output, crop/hotspot px, and display-screen preview. */
export function PixelImageInput(props: ObjectInputProps) {
  const client = useClient({ apiVersion: "2025-01-01" });
  const projectId = useProjectId();
  const dataset = useDataset();
  const value = (props.value ?? undefined) as ImageValue | undefined;
  const readOnly = Boolean(props.readOnly);
  const [natural, setNatural] = useState<ImageDimensions | null>(null);

  useHotspotDialogFooter(value, props.onChange, readOnly);

  const assetRef = value?.asset?._ref;
  const activeScreen = getDisplayPreset(value?.displayScreen);

  useEffect(() => {
    if (!assetRef) {
      setNatural(null);
      return;
    }

    client
      .fetch<{ metadata?: { dimensions?: ImageDimensions } }>(
        `*[_id == $id][0]{ metadata { dimensions { width, height } } }`,
        { id: assetRef },
      )
      .then((doc) => {
        const dimensions = doc?.metadata?.dimensions;
        if (dimensions?.width && dimensions?.height) {
          setNatural({ width: dimensions.width, height: dimensions.height });
        } else {
          setNatural(null);
        }
      })
      .catch(() => setNatural(null));
  }, [assetRef, client]);

  const previewUrl = useMemo(() => {
    if (!projectId || !dataset || !value?.asset) return null;
    try {
      const builder = createImageUrlBuilder({ projectId, dataset });
      const w = value.outputWidth ?? activeScreen.width;
      const h = value.outputHeight ?? activeScreen.height;
      return builder.image(value).width(w).height(h).fit("crop").auto("format").url();
    } catch {
      return null;
    }
  }, [projectId, dataset, value, activeScreen.width, activeScreen.height]);

  const cropPx = useMemo(
    () => (natural ? cropToPixels(value?.crop, natural) : null),
    [natural, value?.crop],
  );

  const hotspotPx = useMemo(
    () => (natural ? hotspotToPixels(value?.hotspot, natural) : null),
    [natural, value?.hotspot],
  );

  const patchOptionalNumber = (field: "outputWidth" | "outputHeight", raw: string) => {
    if (readOnly) return;
    const n = parsePx(raw);
    props.onChange(n && n > 0 ? set(n, [field]) : unset([field]));
  };

  const applyDisplayPreset = (id: DisplayScreenId) => {
    if (readOnly) return;
    const preset = getDisplayPreset(id);
    props.onChange(
      PatchEvent.from([
        set(preset.width, ["outputWidth"]),
        set(preset.height, ["outputHeight"]),
        set(id, ["displayScreen"]),
      ]),
    );
  };

  const patchCrop = (field: keyof NonNullable<typeof cropPx>, raw: string) => {
    if (readOnly || !natural || !cropPx) return;
    const n = parsePx(raw);
    if (n == null) return;
    props.onChange(set(pixelsToCrop({ ...cropPx, [field]: n }, natural), ["crop"]));
  };

  const patchHotspot = (field: keyof NonNullable<typeof hotspotPx>, raw: string) => {
    if (readOnly || !natural || !hotspotPx) return;
    const n = parsePx(raw);
    if (n == null) return;
    props.onChange(set(pixelsToHotspot({ ...hotspotPx, [field]: n }, natural), ["hotspot"]));
  };

  const clearImage = () => {
    if (readOnly) return;
    props.onChange(unset());
  };

  return (
    <Stack space={3}>
      {readOnly ? (
        <Card padding={3} radius={2} tone="caution" border>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Upload, Select, and Clear are disabled
            </Text>
            <Text size={1} muted>
              Studio is in <strong>Published</strong> view (read-only). Switch to draft editing to
              activate image upload, select, clear, and pixel controls.
            </Text>
            <Button text="Enable editing (switch to Draft)" tone="primary" onClick={switchToDraftPerspective} />
          </Stack>
        </Card>
      ) : null}

      {props.renderDefault(props)}

      {!readOnly && value?.asset ? (
        <Flex gap={2} wrap="wrap">
          <Button text="Clear image" mode="ghost" tone="critical" onClick={clearImage} />
        </Flex>
      ) : null}

      {natural && previewUrl ? (
        <Card padding={3} radius={2} border tone="transparent">
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Display screen preview
            </Text>
            <Text size={1} muted>
              Preview how this image renders at {activeScreen.label} ({activeScreen.width}×
              {activeScreen.height} px output).
            </Text>
            <Flex gap={2} wrap="wrap">
              {DISPLAY_SCREEN_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  text={preset.label}
                  mode={value?.displayScreen === preset.id ? "default" : "ghost"}
                  tone={value?.displayScreen === preset.id ? "primary" : "default"}
                  disabled={readOnly}
                  onClick={() => applyDisplayPreset(preset.id)}
                />
              ))}
            </Flex>
            <Flex gap={4} wrap="wrap" align="flex-start">
              {DISPLAY_SCREEN_PRESETS.filter((p) => p.id === (value?.displayScreen ?? "hero")).map(
                (preset) => (
                  <Box key={preset.id}>
                    <Text size={0} muted>
                      {preset.label} frame
                    </Text>
                    <Box
                      marginTop={2}
                      style={{
                        width: preset.previewWidth,
                        aspectRatio: `${preset.width} / ${preset.height}`,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid var(--card-border-color)",
                        background: "var(--card-muted-bg-color)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </Box>
                  </Box>
                ),
              )}
            </Flex>
          </Stack>
        </Card>
      ) : null}

      {natural ? (
        <Card padding={3} radius={2} border tone="transparent">
          <Stack space={4}>
            <Text size={1} weight="semibold">
              Pixel controls
            </Text>
            <Text size={1} muted>
              Source file: {natural.width} × {natural.height} px
            </Text>

            <Stack space={2}>
              <Text size={1} weight="medium">
                Website output size
              </Text>
              <Flex gap={3} wrap="wrap">
                <NumberField
                  label="Width (px)"
                  value={value?.outputWidth}
                  placeholder={String(activeScreen.width)}
                  disabled={readOnly}
                  onChange={(raw) => patchOptionalNumber("outputWidth", raw)}
                />
                <NumberField
                  label="Height (px)"
                  value={value?.outputHeight}
                  placeholder={String(activeScreen.height)}
                  disabled={readOnly}
                  onChange={(raw) => patchOptionalNumber("outputHeight", raw)}
                />
              </Flex>
            </Stack>

            {cropPx ? (
              <Stack space={2}>
                <Text size={1} weight="medium">
                  Crop rectangle (px)
                </Text>
                <Flex gap={3} wrap="wrap">
                  <NumberField label="Left" value={cropPx.left} disabled={readOnly} onChange={(raw) => patchCrop("left", raw)} />
                  <NumberField label="Top" value={cropPx.top} disabled={readOnly} onChange={(raw) => patchCrop("top", raw)} />
                  <NumberField label="Width" value={cropPx.width} disabled={readOnly} onChange={(raw) => patchCrop("width", raw)} />
                  <NumberField label="Height" value={cropPx.height} disabled={readOnly} onChange={(raw) => patchCrop("height", raw)} />
                </Flex>
              </Stack>
            ) : null}

            {hotspotPx ? (
              <Stack space={2}>
                <Text size={1} weight="medium">
                  Hotspot focus (px)
                </Text>
                <Flex gap={3} wrap="wrap">
                  <NumberField label="Center X" value={hotspotPx.centerX} disabled={readOnly} onChange={(raw) => patchHotspot("centerX", raw)} />
                  <NumberField label="Center Y" value={hotspotPx.centerY} disabled={readOnly} onChange={(raw) => patchHotspot("centerY", raw)} />
                  <NumberField label="Area width" value={hotspotPx.width} disabled={readOnly} onChange={(raw) => patchHotspot("width", raw)} />
                  <NumberField label="Area height" value={hotspotPx.height} disabled={readOnly} onChange={(raw) => patchHotspot("height", raw)} />
                </Flex>
              </Stack>
            ) : null}
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}
