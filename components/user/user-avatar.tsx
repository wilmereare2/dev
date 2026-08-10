import { AVATAR_SCALE_DEFAULT, initials } from "@/lib/user/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** Zoom within the circle, 75–150 (100 = default). */
  imageScale?: number;
  className?: string;
};

const sizeClass = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-base",
  xl: "size-24 text-xl",
};

export function UserAvatar({
  name,
  email,
  image,
  size = "md",
  imageScale = AVATAR_SCALE_DEFAULT,
  className,
}: UserAvatarProps) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-semibold text-accent-foreground",
    sizeClass[size],
    className,
  );
  const scale = imageScale / 100;

  if (image) {
    return (
      <span className={classes}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="size-full object-cover"
          style={{
            transform: scale === 1 ? undefined : `scale(${scale})`,
            transformOrigin: "center center",
          }}
        />
      </span>
    );
  }

  return <span className={classes}>{initials(name, email)}</span>;
}
