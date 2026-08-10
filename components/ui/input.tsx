import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-background/80 px-4 text-sm text-foreground outline-none transition",
          "placeholder:text-muted-foreground",
          "focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error && "border-red-500/40 focus-visible:border-red-500/50 focus-visible:ring-red-500/20",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
