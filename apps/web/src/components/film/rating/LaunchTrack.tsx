import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN = 0.5;
const MAX = 10;
const STEP = 0.5;

type LaunchTrackProps = {
  value: number | null;
  // Fires once per gesture: on pointer release, on arrow-key release, or on clear.
  onCommit: (next: number | null) => void;
  disabled?: boolean;
  // Module colour (film or TV); defaults to the theme's action colour.
  accentColor?: string;
  size?: "md" | "sm";
  ariaLabel?: string;
  // Show "Saved 7.5 ✓" after a commit, for controls that write straight to the API.
  confirmSaves?: boolean;
  className?: string;
};

const snap = (ratio: number): number =>
  Math.max(MIN, Math.min(MAX, Math.round(Math.max(0, Math.min(1, ratio)) * 20) / 2));

// The rocket rating input: a horizontal launch track that saves on release, with no Save button.
export const LaunchTrack = ({
  value,
  onCommit,
  disabled = false,
  accentColor = "var(--primary)",
  size = "md",
  ariaLabel = "Rating out of 10",
  confirmSaves = false,
  className,
}: LaunchTrackProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draft, setDraft] = useState<number | null>(value);
  const [savedValue, setSavedValue] = useState<number | null | undefined>(undefined);

  // Follow outside changes (another save, a refetch) without an effect.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const commit = (next: number | null) => {
    if (next === value) return;
    onCommit(next);
    setSavedValue(next);
  };

  const valueAt = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return MIN;
    return snap((clientX - rect.left) / rect.width);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setSavedValue(undefined);
    setDraft(valueAt(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isDragging && !disabled) setDraft(valueAt(event.clientX));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);
    const next = valueAt(event.clientX);
    setDraft(next);
    commit(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const current = draft ?? 0;
    const keyed: Record<string, number | null> = {
      ArrowRight: Math.min(MAX, current + STEP),
      ArrowUp: Math.min(MAX, current + STEP),
      ArrowLeft: current - STEP >= MIN ? current - STEP : null,
      ArrowDown: current - STEP >= MIN ? current - STEP : null,
      Home: MIN,
      End: MAX,
    };
    if (event.key in keyed) {
      event.preventDefault();
      setSavedValue(undefined);
      setDraft(keyed[event.key]!);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      setDraft(null);
      commit(null);
    }
  };

  // Holding an arrow key repeats keydown; save once, on release.
  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!disabled && ["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown", "Home", "End"].includes(event.key)) {
      commit(draft);
    }
  };

  const fill = draft === null ? 0 : (draft / MAX) * 100;
  const isSmall = size === "sm";

  return (
    <div className={cn("select-none", isSmall ? "w-32" : "w-full max-w-72", className)}>
      <div
        ref={trackRef}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={draft ?? 0}
        aria-valuetext={draft === null ? "Not rated" : `${draft} of 10`}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        className={cn(
          "relative touch-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          isSmall ? "h-6" : "h-9",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-ew-resize",
        )}
        style={{ "--launch-accent": accentColor } as CSSProperties}
      >
        <div className="absolute inset-x-0 top-1/2 border-t-2 border-[color:var(--line)]" />
        <div className="absolute inset-x-0 top-1/2 h-3.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,var(--line-strong)_0_1px,transparent_1px_calc(10%-0.1px))]" />
        <div
          className={cn("absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-sm", !isDragging && "transition-[width] duration-150")}
          style={{ width: `${fill}%`, background: "linear-gradient(90deg, transparent, var(--launch-accent))" }}
        />
        <Rocket
          aria-hidden
          className={cn(
            "absolute top-1/2 rotate-45 fill-current",
            isSmall ? "size-4" : "size-6",
            !isDragging && "transition-[left] duration-150",
          )}
          style={{
            left: `${fill}%`,
            transform: "translate(-50%, -50%) rotate(45deg)",
            color: draft === null ? "var(--line-strong)" : "var(--launch-accent)",
          }}
        />
        {isDragging && draft !== null ? (
          <span
            aria-hidden
            className="absolute -top-4 -translate-x-1/2 rounded-sm px-1 font-mono text-[11px] font-bold text-primary-foreground"
            style={{ left: `${fill}%`, background: "var(--launch-accent)" }}
          >
            {draft.toFixed(1)}
          </span>
        ) : null}
      </div>

      {isSmall ? null : (
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>
            {draft === null
              ? "Not rated · drag to launch"
              : confirmSaves && savedValue === draft
                ? `Saved ${draft.toFixed(1)} ✓`
                : `${draft.toFixed(1)} / 10`}
          </span>
          {draft !== null && !disabled ? (
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                commit(null);
              }}
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
