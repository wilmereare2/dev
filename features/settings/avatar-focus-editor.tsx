"use client";

import { useRef } from "react";
import { Move } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { clampAvatarFocus, type AvatarFraming } from "@/lib/user/avatar";
import { cn } from "@/lib/utils";

type AvatarFocusEditorProps = {
  image: string;
  name?: string | null;
  email?: string | null;
  framing: AvatarFraming;
  onFramingChange: (next: Partial<AvatarFraming>) => void;
  disabled?: boolean;
};

const DRAG_SENSITIVITY = 0.22;

export function AvatarFocusEditor({
  image,
  name,
  email,
  framing,
  onFramingChange,
  disabled,
}: AvatarFocusEditorProps) {
  const dragRef = useRef<{ x: number; y: number; focusX: number; focusY: number } | null>(null);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      focusX: framing.focusX,
      focusY: framing.focusY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || disabled) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    onFramingChange({
      focusX: clampAvatarFocus(dragRef.current.focusX + dx * DRAG_SENSITIVITY),
      focusY: clampAvatarFocus(dragRef.current.focusY + dy * DRAG_SENSITIVITY),
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="application"
        aria-label="Drag to position your face in the avatar circle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "relative touch-none rounded-full ring-2 ring-accent/40 ring-offset-2 ring-offset-background",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <UserAvatar
          name={name}
          email={email}
          image={image}
          size="xl"
          imageScale={framing.scale}
          imageFocusX={framing.focusX}
          imageFocusY={framing.focusY}
          className="size-28 text-2xl sm:size-32"
        />
        {!disabled ? (
          <span className="pointer-events-none absolute inset-0 rounded-full border border-white/10" aria-hidden />
        ) : null}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Move className="size-3.5 shrink-0" aria-hidden />
        Drag photo to focus your face
      </p>
    </div>
  );
}
