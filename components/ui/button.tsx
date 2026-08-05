import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-accent to-accent/85 text-accent-foreground shadow-md shadow-accent/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 active:translate-y-0 active:scale-[0.98]",
        premium:
          "bg-gradient-to-r from-accent via-rose-500 to-accent text-accent-foreground shadow-lg shadow-accent/25 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/35 active:translate-y-0 active:scale-[0.98]",
        secondary:
          "bg-surface text-foreground border border-border hover:-translate-y-0.5 hover:bg-muted hover:shadow-md active:translate-y-0",
        ghost: "hover:bg-muted text-foreground",
        outline:
          "border border-border bg-transparent hover:bg-muted text-foreground",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
