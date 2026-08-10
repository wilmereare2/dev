import { cn } from "@/lib/utils";

type VisibilityBadgeProps = {
  visibility: "public" | "private";
  className?: string;
};

export function VisibilityBadge({ visibility, className }: VisibilityBadgeProps) {
  const isPublic = visibility === "public";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isPublic
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-border/60 bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      {isPublic ? "Public" : "Private"}
    </span>
  );
}
