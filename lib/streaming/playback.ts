import crypto from "crypto";

type PlaybackInput = {
  playbackUrl?: string;
  streamAssetId?: string;
  userId?: string;
  isPremium?: boolean;
  hasSubscription?: boolean;
};

export async function resolvePlaybackUrl(input: PlaybackInput) {
  if (input.isPremium && !input.hasSubscription) {
    return null;
  }

  if (input.streamAssetId && process.env.MUX_TOKEN_ID && process.env.MUX_SIGNING_KEY) {
    return signMuxPlaybackUrl(input.streamAssetId);
  }

  return input.playbackUrl ?? null;
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
