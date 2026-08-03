"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Card, Flex, Label, Stack, Text } from "@sanity/ui";
import { PatchEvent, set, unset, useClient, type ObjectInputProps } from "sanity";

type FileValue = {
  _type?: "file";
  asset?: { _type?: "reference"; _ref?: string };
};

type AssetDoc = {
  _id: string;
  url?: string;
  originalFilename?: string;
  size?: number;
};

function formatBytes(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "";
  return `${formatBytes(bytesPerSecond)}/s`;
}

/**
 * Direct Sanity asset upload — skips Studio's SHA-1 pre-scan so large videos start uploading immediately.
 */
export function FastVideoFileInput(props: ObjectInputProps) {
  const client = useClient({ apiVersion: "2025-01-01" });
  const value = (props.value ?? undefined) as FileValue | undefined;
  const readOnly = Boolean(props.readOnly);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadSubRef = useRef<{ unsubscribe: () => void } | null>(null);
  const uploadStartedAtRef = useRef<number | null>(null);

  const [asset, setAsset] = useState<AssetDoc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transferred, setTransferred] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const assetRef = value?.asset?._ref;

  useEffect(() => {
    if (!assetRef) {
      setAsset(null);
      return;
    }

    let cancelled = false;
    client
      .fetch<AssetDoc>(
        `*[_id == $id][0]{ _id, url, originalFilename, size }`,
        { id: assetRef },
      )
      .then((doc) => {
        if (!cancelled) setAsset(doc ?? null);
      })
      .catch(() => {
        if (!cancelled) setAsset(null);
      });

    return () => {
      cancelled = true;
    };
  }, [assetRef, client]);

  useEffect(() => {
    return () => uploadSubRef.current?.unsubscribe();
  }, []);

  const cancelUpload = useCallback(() => {
    uploadSubRef.current?.unsubscribe();
    uploadSubRef.current = null;
    uploadStartedAtRef.current = null;
    setUploading(false);
    setProgress(0);
    setTransferred(0);
    setTotalBytes(0);
  }, []);

  const clearFile = useCallback(() => {
    if (readOnly) return;
    props.onChange(PatchEvent.from([unset()]));
  }, [props, readOnly]);

  const startUpload = useCallback(
    (file: File) => {
      if (readOnly) return;

      if (!file.type.startsWith("video/")) {
        setError("Please choose a video file (MP4, WebM, etc.).");
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);
      setTransferred(0);
      setTotalBytes(file.size);
      uploadStartedAtRef.current = Date.now();

      uploadSubRef.current?.unsubscribe();

      const subscription = client.observable.assets
        .upload("file", file, {
          preserveFilename: true,
          contentType: file.type || "video/mp4",
          extract: ["none"],
        })
        .subscribe({
          next: (event) => {
            if (event.type === "progress") {
              const progressEvent = event as {
                percent?: number;
                transferred?: number;
                length?: number;
              };
              const percent =
                typeof progressEvent.percent === "number" ? progressEvent.percent : 0;
              setProgress(Math.min(100, Math.max(0, percent)));
              if (typeof progressEvent.transferred === "number") {
                setTransferred(progressEvent.transferred);
              }
              if (typeof progressEvent.length === "number" && progressEvent.length > 0) {
                setTotalBytes(progressEvent.length);
              }
              return;
            }

            if (event.type === "response") {
              const doc = event.body?.document as AssetDoc | undefined;
              if (!doc?._id) {
                setError("Upload finished but Sanity did not return an asset id.");
                setUploading(false);
                return;
              }

              props.onChange(
                PatchEvent.from([
                  set({
                    _type: "file",
                    asset: { _type: "reference", _ref: doc._id },
                  }),
                ]),
              );
              setAsset(doc);
              setUploading(false);
              setProgress(100);
              uploadSubRef.current = null;
              uploadStartedAtRef.current = null;
            }
          },
          error: (err: Error) => {
            setError(err.message || "Upload failed.");
            setUploading(false);
            uploadSubRef.current = null;
            uploadStartedAtRef.current = null;
          },
        });

      uploadSubRef.current = subscription;
    },
    [client, props, readOnly],
  );

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) startUpload(file);
    },
    [startUpload],
  );

  const elapsedSeconds =
    uploadStartedAtRef.current != null
      ? Math.max(0.001, (Date.now() - uploadStartedAtRef.current) / 1000)
      : 0;
  const speed = uploading && transferred > 0 ? transferred / elapsedSeconds : 0;

  return (
    <Stack space={3}>
      <Text size={1} muted>
        Fast upload — starts immediately without scanning the whole file first. Use a JPG/PNG in
        Thumbnail, not here.
      </Text>

      {asset ? (
        <Card padding={3} radius={2} shadow={1} tone="transparent">
          <Stack space={3}>
            <Flex align="center" justify="space-between" gap={3}>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  {asset.originalFilename ?? "Uploaded video"}
                </Text>
                {asset.size ? (
                  <Text size={1} muted>
                    {formatBytes(asset.size)}
                  </Text>
                ) : null}
                {asset.url ? (
                  <Text size={1}>
                    <a href={asset.url} target="_blank" rel="noreferrer">
                      Open file on Sanity CDN
                    </a>
                  </Text>
                ) : null}
              </Stack>
              {!readOnly ? (
                <Button text="Remove" mode="ghost" tone="critical" onClick={clearFile} />
              ) : null}
            </Flex>
          </Stack>
        </Card>
      ) : null}

      {!readOnly ? (
        <Box>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={onFileChange}
          />
          <Button
            text={uploading ? "Uploading…" : asset ? "Replace video" : "Upload video"}
            tone="primary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          />
        </Box>
      ) : null}

      {uploading ? (
        <Card padding={3} radius={2} tone="primary">
          <Stack space={3}>
            <Flex align="center" justify="space-between" gap={3}>
              <Label size={1}>Uploading… {Math.round(progress)}%</Label>
              <Button text="Cancel" mode="ghost" onClick={cancelUpload} />
            </Flex>
            <Box
              style={{
                height: 8,
                borderRadius: 4,
                background: "var(--card-border-faint-color)",
                overflow: "hidden",
              }}
            >
              <Box
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "var(--card-focus-ring-color)",
                  transition: "width 120ms linear",
                }}
              />
            </Box>
            <Flex gap={3} wrap="wrap">
              <Text size={1} muted>
                {formatBytes(transferred)}
                {totalBytes ? ` / ${formatBytes(totalBytes)}` : ""}
              </Text>
              {speed > 0 ? (
                <Text size={1} muted>
                  {formatSpeed(speed)}
                </Text>
              ) : null}
            </Flex>
          </Stack>
        </Card>
      ) : null}

      {error ? (
        <Card padding={3} radius={2} tone="critical">
          <Text size={1}>{error}</Text>
        </Card>
      ) : null}
    </Stack>
  );
}
