import { initials } from "@/lib/user/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClass = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-base",
  xl: "size-24 text-xl",
};

export function UserAvatar({ name, email, image, size = "md", className }: UserAvatarProps) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-semibold text-accent-foreground",
    sizeClass[size],
    className,
  );

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="" className={cn(classes, "object-cover")} />
    );
  }

  return <span className={classes}>{initials(name, email)}</span>;
}
