import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const ratingSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
} as const;

const MAX_SPACE_RATING = 5;
const RATING_STEP = 0.5;

const clampUnit = (value: number): number => {
  return Math.max(0, Math.min(1, value));
};

const toFillRatio = (ratingOutOfFive: number | null, index: number): number => {
  if (ratingOutOfFive === null || Number.isNaN(ratingOutOfFive)) {
    return 0;
  }

  return clampUnit(ratingOutOfFive - index);
};

const toStepLabel = (value: number): string => {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
};

const isSameRating = (left: number | null, right: number): boolean => {
  if (left === null) {
    return false;
  }

  return Math.abs(left - right) < 0.001;
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
        <span className={cn("flex h-full items-center justify-center", iconSizeClass)}>
          <Rocket className={cn(iconSizeClass, "fill-current", filledClassName)} />
        </span>
      </span>
    </span>
  );
};

type SpaceRatingDisplayProps = {
  ratingOutOfFive: number | null;
  size?: keyof typeof ratingSizes;
  className?: string;
};

export const SpaceRatingDisplay = ({
  ratingOutOfFive,
  size = "md",
  className,
}: SpaceRatingDisplayProps) => {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: MAX_SPACE_RATING }).map((_, index) => (
        <SpaceRocket
          key={`space-rating-${size}-${index}`}
          fill={toFillRatio(ratingOutOfFive, index)}
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
};

export const SpaceRatingInput = ({
  value,
  onChange,
  disabled = false,
}: SpaceRatingInputProps) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: MAX_SPACE_RATING }).map((_, index) => {
        const leftStepValue = (index + 1) - RATING_STEP;
        const rightStepValue = index + 1;

        return (
          <div key={`space-rating-input-${index + 1}`} className="group relative h-6 w-6">
            <SpaceRocket
              fill={toFillRatio(value, index)}
              size="lg"
              className="h-6 w-6"
              baseClassName="text-muted-foreground/55 transition-colors group-hover:text-foreground/75"
              filledClassName="text-primary"
            />

            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/70 disabled:cursor-not-allowed"
              aria-label={`Rate ${toStepLabel(leftStepValue)} out of 5`}
              disabled={disabled}
              onClick={() => {
                onChange(isSameRating(value, leftStepValue) ? null : leftStepValue);
              }}
            />

            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/70 disabled:cursor-not-allowed"
              aria-label={`Rate ${toStepLabel(rightStepValue)} out of 5`}
              disabled={disabled}
              onClick={() => {
                onChange(isSameRating(value, rightStepValue) ? null : rightStepValue);
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
