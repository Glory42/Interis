import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AccountFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  id: string;
  label: string;
  onValueChange: (value: string) => void;
  isPassword?: boolean;
};

export const fieldInput =
  "w-full rounded-[2px] border border-[color:var(--line)] bg-foreground/[0.03] px-2.5 py-2 text-base text-foreground outline-none focus:border-[color:var(--primary)] sm:text-sm";

// A labelled input; password fields get a SHOW toggle instead of a confirm field.
export const AccountField = ({ id, label, onValueChange, isPassword = false, className, ...props }: AccountFieldProps) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={id} className="kicker mb-1 block text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          {...props}
          type={isPassword && !isVisible ? "password" : props.type ?? "text"}
          onChange={(event) => onValueChange(event.target.value)}
          className={cn(fieldInput, isPassword && "pr-14")}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            className="mono-meta absolute top-1/2 right-2.5 -translate-y-1/2 uppercase text-muted-foreground hover:text-foreground"
          >
            {isVisible ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
    </div>
  );
};
