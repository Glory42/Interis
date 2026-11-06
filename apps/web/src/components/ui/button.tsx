import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// components.html §2: 3px corners, no glow, 1px press, 44px tall on phones and 32px from sm up.
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent font-semibold transition-colors active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/85",
        secondary: "border-[color:var(--line-strong)] text-foreground hover:bg-foreground/5",
        outline: "border-[color:var(--line-strong)] text-foreground hover:bg-foreground/5",
        ghost: "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
        danger:
          "border-destructive/55 text-destructive hover:border-destructive hover:bg-destructive hover:text-background",
        link: "h-auto rounded-none border-0 border-b border-[color:var(--line-strong)] px-0 pb-px font-medium text-foreground hover:border-primary hover:text-primary",
        icon: "border-[color:var(--line)] text-muted-foreground hover:border-[color:var(--line-strong)] hover:text-foreground",
      },
      size: {
        sm: "h-9 px-2.5 text-[11px] sm:h-7",
        md: "h-11 px-3 text-xs sm:h-8",
        lg: "h-11 px-4 text-sm sm:h-10",
      },
    },
    compoundVariants: [
      { variant: "icon", size: "sm", className: "w-9 px-0 sm:w-7" },
      { variant: "icon", size: "md", className: "w-11 px-0 sm:w-8" },
      { variant: "icon", size: "lg", className: "w-11 px-0 sm:w-10" },
      { variant: "link", className: "h-auto sm:h-auto" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

// Three reel ticks instead of a spinner; the label stays in place so the width holds.
const LoadingTicks = () => (
  <span aria-hidden className="absolute inset-0 flex items-center justify-center gap-0.5">
    {[0, 1, 2].map((tick) => (
      <i
        key={tick}
        className="h-2.5 w-[3px] animate-pulse bg-current"
        style={{ animationDelay: `${tick * 150}ms` }}
      />
    ))}
  </span>
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <span className="invisible inline-flex items-center gap-2">{children}</span>
            <LoadingTicks />
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
