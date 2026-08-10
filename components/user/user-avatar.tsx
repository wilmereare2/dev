import {
  AVATAR_FOCUS_DEFAULT,
  AVATAR_SCALE_DEFAULT,
  initials,
  normalizeAvatarFraming,
  type AvatarFraming,
} from "@/lib/user/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** Zoom within the circle, 75–150 (100 = default). */
  imageScale?: number;
  /** Horizontal pan while focusing, -50–50. */
  imageFocusX?: number;
  /** Vertical pan while focusing, -50–50. */
  imageFocusY?: number;
  className?: string;
};

const sizeClass = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-base",
  xl: "size-24 text-xl",
};

function avatarImageStyle(framing: AvatarFraming) {
  const scale = framing.scale / 100;
  const { focusX, focusY } = framing;
  if (scale === 1 && focusX === 0 && focusY === 0) return undefined;
  return {
    transform: `scale(${scale}) translate(${focusX}%, ${focusY}%)`,
    transformOrigin: "center center",
  } as const;
}

export function UserAvatar({
  name,
  email,
  image,
  size = "md",
  imageScale = AVATAR_SCALE_DEFAULT,
  imageFocusX = AVATAR_FOCUS_DEFAULT,
  imageFocusY = AVATAR_FOCUS_DEFAULT,
  className,
}: UserAvatarProps) {
  const framing = normalizeAvatarFraming({
    scale: imageScale,
    focusX: imageFocusX,
    focusY: imageFocusY,
  });

  const classes = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-semibold text-accent-foreground",
    sizeClass[size],
    className,
  );

  if (image) {
    return (
      <span className={classes}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="size-full object-cover" style={avatarImageStyle(framing)} />
      </span>
    );
  }

  return <span className={classes}>{initials(name, email)}</span>;
}

export { avatarImageStyle };
