import { cn } from "@/lib/utils";
import type { PageBackgroundVariant } from "@/lib/site/page-theme";

const VARIANTS: Record<PageBackgroundVariant, string> = {
  default: "",
  library:
    "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--background)_96%,var(--surface)),var(--background))]",
  profile:
    "bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.08),transparent_50%)]",
  premium:
    "bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.14),transparent_52%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_90%,#422006),var(--background))]",
  creator:
    "bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.16),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.1),transparent_45%)] animate-[pulse_10s_ease-in-out_infinite]",
};

type PageBackgroundProps = {
  variant: PageBackgroundVariant;
};

export function PageBackground({ variant }: PageBackgroundProps) {
  if (variant === "default") return null;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 opacity-90", VARIANTS[variant])}
    />
  );
}
