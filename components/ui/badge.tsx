import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-border/60 bg-muted/50 text-muted-foreground",
        accent: "border-accent/30 bg-accent/10 text-accent",
        public: "border-accent/30 bg-accent/10 text-accent",
        private: "border-border/60 bg-muted/50 text-muted-foreground",
        followers: "border-sky-500/30 bg-sky-500/10 text-sky-400",
        subscribers: "border-violet-500/30 bg-violet-500/10 text-violet-300",
        premium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        ppv: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        error: "border-red-500/30 bg-red-500/10 text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function visibilityBadgeVariant(
  visibility: string,
): VariantProps<typeof badgeVariants>["variant"] {
  switch (visibility.toLowerCase()) {
    case "public":
      return "public";
    case "private":
      return "private";
    case "followers":
      return "followers";
    case "subscribers":
      return "subscribers";
    default:
      return "default";
  }
}
