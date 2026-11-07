import { useState, type InputHTMLAttributes } from "react";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/features/auth/password";
import { cn } from "@/lib/utils";

type AccountFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "prefix"> & {
  id: string;
  label: string;
  onValueChange: (value: string) => void;
  isPassword?: boolean;
  // Fixed text shown inside the field before the value, e.g. "/profile/".
  prefix?: string;
  error?: string | null;
};

export const fieldInput =
  "w-full rounded-[2px] border border-[color:var(--line)] bg-foreground/[0.03] px-2.5 py-2 text-base text-foreground outline-none focus:border-[color:var(--primary)] sm:text-sm";

// A labelled input; password fields get a SHOW toggle instead of a confirm field.
export const AccountField = ({ id, label, onValueChange, isPassword = false, prefix, error, className, ...props }: AccountFieldProps) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={id} className="kicker mb-1 block text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        {prefix ? (
          <span className="body-s pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">{prefix}</span>
        ) : null}
        <input
          id={id}
          {...props}
          type={isPassword && !isVisible ? "password" : props.type ?? "text"}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(fieldInput, isPassword && "pr-14", prefix && "pl-[4.6rem]", error && "border-[color:var(--danger)]")}
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
      {error ? (
        <p id={`${id}-error`} className="body-s mt-1 text-[color:var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
};

// Eight ticks fill up to the minimum length, like a reel counting in.
export const PasswordLengthHint = ({ length }: { length: number }) => {
  const remaining = PASSWORD_MIN - length;
  return (
    <p className="mono-meta mt-1.5 flex items-center gap-2 text-muted-foreground">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: PASSWORD_MIN }, (_, index) => (
          <i key={index} className={cn("block h-1.5 w-2.5 rounded-[1px]", index < length ? "bg-primary" : "bg-foreground/15")} />
        ))}
      </span>
      {`${length} / ${PASSWORD_MAX} · ${remaining > 0 ? `${remaining} more` : "OK"}`}
    </p>
  );
};
