type ScanInput = {
  title?: string;
  description?: string;
  mediaType?: string;
  fileSizeBytes?: number;
  mimeType?: string;
};

export type AiScanResult = {
  score: number;
  flags: string[];
  recommendation: "approve" | "review" | "reject";
};

const BLOCKED_KEYWORDS = ["underage", "minor", "illegal", "non-consensual"];

export function scanContentForModeration(input: ScanInput): AiScanResult {
  const flags: string[] = [];
  let score = 0.95;

  const text = `${input.title ?? ""} ${input.description ?? ""}`.toLowerCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    if (text.includes(keyword)) {
      flags.push(`keyword:${keyword}`);
      score = 0.1;
    }
  }

  if (input.fileSizeBytes && input.fileSizeBytes > 500 * 1024 * 1024) {
    flags.push("oversized_file");
    score = Math.min(score, 0.4);
  }

  if (input.mimeType && !input.mimeType.startsWith("image/") && !input.mimeType.startsWith("video/") && !input.mimeType.startsWith("audio/")) {
    flags.push("unexpected_mime");
    score = Math.min(score, 0.3);
  }

  if (flags.some((flag) => flag.startsWith("keyword:"))) {
    return { score, flags, recommendation: "reject" };
  }
  if (flags.length > 0) {
    return { score, flags, recommendation: "review" };
  }
  return { score, flags, recommendation: "approve" };
}
