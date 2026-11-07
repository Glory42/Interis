import { Check } from "lucide-react";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { cn } from "@/lib/utils";

type WatchTickProps = {
  label: string;
  pressed: boolean;
  onClick: () => void;
  className?: string;
};

// The one tick that marks a season or episode watched.
export const WatchTick = ({ label, pressed, onClick, className }: WatchTickProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={pressed}
    onClick={onClick}
    className={cn(
      "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
      className,
    )}
    style={{
      borderColor: pressed ? SERIAL_MODULE_STYLES.accent : "var(--line-strong)",
      background: pressed ? SERIAL_MODULE_STYLES.accent : "transparent",
      color: "var(--bg)",
    }}
  >
    {pressed ? <Check aria-hidden className="size-3" strokeWidth={3} /> : null}
  </button>
);
