import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldClasses } from "@/components/ui/input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string | null;
  // Shows "n / maxLength" under the field; needs maxLength.
  showCount?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, showCount = false, id, onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const errorId = `${id ?? generatedId}-error`;
    const isControlled = props.value !== undefined;
    const [uncontrolledLength, setUncontrolledLength] = React.useState(
      String(props.defaultValue ?? "").length,
    );
    const length = isControlled ? String(props.value ?? "").length : uncontrolledLength;

    return (
      <>
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={error ? errorId : props["aria-describedby"]}
          className={cn(fieldClasses, "min-h-24 py-2", className)}
          onChange={(event) => {
            if (!isControlled) setUncontrolledLength(event.target.value.length);
            onChange?.(event);
          }}
          {...props}
        />
        {error || (showCount && props.maxLength) ? (
          <div className="mt-1 flex justify-between gap-3 text-[11px]">
            <p id={errorId} className="text-destructive">
              {error}
            </p>
            {showCount && props.maxLength ? (
              <span className="font-mono text-muted-foreground">
                {length} / {props.maxLength}
              </span>
            ) : null}
          </div>
        ) : null}
      </>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
