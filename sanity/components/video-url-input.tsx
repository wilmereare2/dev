"use client";

import { Stack, Text } from "@sanity/ui";
import { StringInput, type StringInputProps } from "sanity";

/** URL field with guidance — prefer hosted URLs for very large files. */
export function VideoUrlInput(props: StringInputProps) {
  return (
    <Stack space={3}>
      <StringInput {...props} />
      <Text size={1} muted>
        YouTube, Vimeo, Pexels page links, or any direct MP4 link. Pexels page URLs are resolved
        automatically on playback. For files under ~500 MB, the Video file upload below is usually
        faster in Studio.
      </Text>
    </Stack>
  );
}
