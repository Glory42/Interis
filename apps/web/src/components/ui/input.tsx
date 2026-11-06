import * as React from "react";
import { cn } from "@/lib/utils";

// 16px text below 640px so iOS Safari doesn't zoom on focus.
export const fieldClasses =
  "w-full rounded-md border border-[color:var(--line-strong)] bg-foreground/[0.03] px-2.5 text-base text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive sm:text-sm";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string | null;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const errorId = `${id ?? generatedId}-error`;

    return (
      <>
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={error ? errorId : props["aria-describedby"]}
          className={cn(fieldClasses, "h-11 sm:h-9", className)}
          {...props}
        />
        {error ? (
          <p id={errorId} className="mt-1 text-[11px] text-destructive">
            {error}
          </p>
        ) : null}
      </>
    );
  },
);

Input.displayName = "Input";

export { Input };
