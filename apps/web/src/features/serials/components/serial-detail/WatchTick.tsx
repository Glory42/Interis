import { Check } from "lucide-react";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { cn } from "@/lib/utils";

type WatchTickProps = {
  label: string;
  pressed: boolean;
  onClick: () => void;
  // lg: a 26px tick inside a 44px tap area, for phones.
  size?: "sm" | "lg";
};

// The one tick that marks a season or episode watched.
export const WatchTick = ({ label, pressed, onClick, size = "sm" }: WatchTickProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={pressed}
    onClick={onClick}
    className={cn("flex shrink-0 items-center justify-center", size === "lg" ? "-mx-[9px] size-11" : "size-5")}
  >
    <span
      className={cn(
        "flex items-center justify-center rounded-full border-[1.5px] transition-colors",
        size === "lg" ? "size-[26px]" : "size-5",
      )}
      style={{
        borderColor: pressed ? SERIAL_MODULE_STYLES.accent : "var(--line-strong)",
        background: pressed ? SERIAL_MODULE_STYLES.accent : "transparent",
        color: "var(--bg)",
      }}
    >
      {pressed ? <Check aria-hidden className={size === "lg" ? "size-4" : "size-3"} strokeWidth={3} /> : null}
    </span>
  </button>
);
