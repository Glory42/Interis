import { useRef, useState } from "react";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const ratingSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

const MAX_SPACE_RATING = 10;
const clampUnit = (value: number): number => {
  return Math.max(0, Math.min(1, value));
};

const toFillRatio = (ratingOutOfTen: number | null, index: number): number => {
  if (ratingOutOfTen === null || Number.isNaN(ratingOutOfTen)) {
    return 0;
  }

  return clampUnit(ratingOutOfTen - index);
};

type SpaceRocketProps = {
  fill: number;
  size: keyof typeof ratingSizes;
  className?: string;
  baseClassName: string;
  filledClassName: string;
};

const SpaceRocket = ({
  fill,
  size,
  className,
  baseClassName,
  filledClassName,
}: SpaceRocketProps) => {
  const clampedFill = clampUnit(fill);
  const iconSizeClass = ratingSizes[size];

  return (
    <span
      className={cn("relative inline-flex shrink-0", iconSizeClass, className)}
      aria-hidden
    >
      <span className="absolute inset-0 flex items-center justify-center">
        <Rocket className={cn(iconSizeClass, "fill-none", baseClassName)} />
      </span>

      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${clampedFill * 100}%` }}
      >
        <span
          className={cn(
            "flex h-full items-center justify-center",
            iconSizeClass,
          )}
        >
          <Rocket
            className={cn(iconSizeClass, "fill-current", filledClassName)}
          />
        </span>
      </span>
    </span>
  );
};

type SpaceRatingDisplayProps = {
  rating: number | null;
  size?: keyof typeof ratingSizes;
  className?: string;
};

export const SpaceRatingDisplay = ({
  rating,
  size = "md",
  className,
}: SpaceRatingDisplayProps) => {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: MAX_SPACE_RATING }).map((_, index) => (
        <SpaceRocket
          key={`space-rating-${size}-${index}`}
          fill={toFillRatio(rating, index)}
          size={size}
          baseClassName="text-muted-foreground/65"
          filledClassName="text-primary"
        />
      ))}
    </div>
  );
};

type SpaceRatingInputProps = {
  value: number | null;
  onChange: (nextValue: number | null) => void;
  disabled?: boolean;
  // True: commits on every interaction (Log modal - onChange is local form
  // state, form batches the real save on submit). False (default): explicit
  // Save step, since onChange fires an API call per change here and this
  // avoids writing on every drag frame (e.g. detail-page sidebar).
  autoSave?: boolean;
};

const TRACK_HEIGHT = 160;

export const SpaceRatingInput = ({
  value,
  onChange,
  disabled = false,
  autoSave = false,
}: SpaceRatingInputProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draft, setDraft] = useState<number | null>(value);

  // Keep draft in sync when the saved value changes externally (e.g. after a
  // successful save). Adjusted during render rather than in an effect to
  // avoid an extra commit + repaint on every value change.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const isDirty = draft !== value;

  const snapRating = (clientY: number): number => {
    const el = trackRef.current;
    if (!el) return 0.5;
    const { top, height } = el.getBoundingClientRect();
    const ratio = 1 - Math.max(0, Math.min(1, (clientY - top) / height));
    return Math.max(0.5, Math.min(10, Math.round(ratio * 20) / 2));
  };

  const setDraftAndMaybeCommit = (next: number | null) => {
    setDraft(next);
    if (autoSave) {
      onChange(next);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const next = snapRating(e.clientY);
    setDraft(next === draft ? null : next);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    setDraft(snapRating(e.clientY));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    if (autoSave && draft !== null) {
      onChange(draft);
    }
  };

  const fillPct = draft !== null ? (draft / 10) * 100 : 0;

  const saveDisabled = disabled || !isDirty || draft === null;
  const clearDisabled = disabled || (draft === null && value === null);

  return (
    <div className="flex items-end gap-2 select-none">
      {/* Scale labels */}
      <div
        className="flex flex-col justify-between text-right"
        style={{ height: TRACK_HEIGHT }}
        aria-hidden
      >
        {[10, 8, 6, 4, 2, 0].map((n) => (
          <span key={n} className="font-mono text-[9px] leading-none text-muted-foreground/40">
            {n}
          </span>
        ))}
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        style={{ width: 24, height: TRACK_HEIGHT }}
        className={cn(
          "relative touch-none",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-ns-resize",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => {
          if (!disabled) setDraftAndMaybeCommit(null);
        }}
        role="slider"
        aria-label="Rating out of 10"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={draft ?? 0}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setDraftAndMaybeCommit(Math.min(10, (draft ?? 0) + 0.5));
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setDraftAndMaybeCommit(draft !== null && draft > 0.5 ? draft - 0.5 : null);
          }
        }}
      >
        {/* Track background */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border/40" />

        {/* Fill */}
        <div
          className={cn(
            "absolute inset-y-0 left-1/2 w-px origin-bottom bg-primary/65",
            !isDragging && "transition-transform duration-100",
          )}
          style={{ transform: `translateX(-50%) scaleY(${fillPct / 100})` }}
        />

        {/* Tick marks */}
        {Array.from({ length: 21 }, (_, i) => {
          const r = i * 0.5;
          return (
            <div
              key={r}
              className={cn(
                "absolute left-1/2 h-px -translate-x-1/2",
                Number.isInteger(r)
                  ? "w-full bg-border/45"
                  : "w-1/2 bg-border/25",
              )}
              style={{ bottom: `${(r / 10) * 100}%` }}
            />
          );
        })}

        {/* Launchpad */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/70" />

        {/* Rocket */}
        <div
          className={cn(
            "absolute bottom-0 left-1/2 pointer-events-none",
            !isDragging && "transition-transform duration-150",
          )}
          style={{
            transform: `translate(-50%, 50%) translateY(-${(fillPct / 100) * TRACK_HEIGHT}px)`,
          }}
        >
          <Rocket
            className={cn(
              "h-4 w-4 transition-colors duration-150",
              draft !== null ? "text-primary" : "text-muted-foreground/25",
            )}
          />
        </div>
      </div>

      {/* Readout + Save / Clear */}
      <div
        className="flex flex-col justify-end gap-1.5 pb-px"
        style={{ height: TRACK_HEIGHT }}
      >
        <div>
          <span
            className={cn(
              "font-mono text-base tabular-nums font-bold transition-colors duration-150",
              draft !== null ? "text-foreground" : "text-muted-foreground/35",
            )}
          >
            {draft !== null ? `${draft}/10` : "—"}
          </span>
          {!autoSave && isDirty && (
            <span className="mt-0.5 block font-mono text-[9px] leading-none text-muted-foreground/45">
              unsaved
            </span>
          )}
        </div>
        {!autoSave && (
          <button
            type="button"
            disabled={saveDisabled}
            onClick={() => {
              if (draft !== null) onChange(draft);
            }}
            className="rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-primary transition-[color,background-color,transform] active:scale-[0.97] hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-25"
          >
            Save
          </button>
        )}
        <button
          type="button"
          disabled={clearDisabled}
          onClick={() => {
            setDraft(null);
            onChange(null);
          }}
          className="rounded-full border border-border/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-[color,background-color,transform] active:scale-[0.97] hover:bg-secondary/30 disabled:cursor-not-allowed disabled:opacity-25"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
