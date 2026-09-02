import crypto from "crypto";
import { resolveVideoUrl, type ResolvedVideo } from "@/lib/streaming/video-url";

type PlaybackInput = {
  playbackUrl?: string;
  streamAssetId?: string;
  userId?: string;
  isPremium?: boolean;
  hasSubscription?: boolean;
};

export type PlaybackResult = ResolvedVideo | { kind: "direct"; url: string };

export async function resolvePlayback(input: PlaybackInput): Promise<PlaybackResult | null> {
  if (input.isPremium && !input.hasSubscription) {
    return null;
  }

  if (input.streamAssetId && process.env.MUX_TOKEN_ID && process.env.MUX_SIGNING_KEY) {
    const muxUrl = signMuxPlaybackUrl(input.streamAssetId);
    return muxUrl ? { kind: "direct", url: muxUrl } : null;
  }

  if (!input.playbackUrl) return null;
  return resolveVideoUrl(input.playbackUrl);
}

/** @deprecated Use resolvePlayback — kept for callers expecting a plain URL string. */
export async function resolvePlaybackUrl(input: PlaybackInput) {
  const resolved = await resolvePlayback(input);
  if (!resolved) return null;
  return resolved.kind === "embed" ? resolved.embedUrl : resolved.url;
}

function signMuxPlaybackUrl(playbackId: string) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const privateKey = process.env.MUX_SIGNING_KEY;
  if (!keyId || !privateKey) return null;

  const baseUrl = `https://stream.mux.com/${playbackId}.m3u8`;
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  const token = crypto
    .createHmac("sha256", privateKey)
    .update(`${baseUrl}?exp=${exp}`)
    .digest("hex");

  return `${baseUrl}?exp=${exp}&sig=${token}&kid=${keyId}`;
}
