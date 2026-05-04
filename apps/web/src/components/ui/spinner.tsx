import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
};

export const Spinner = ({ className }: SpinnerProps) => (
  <span
    className={cn(
      "inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary",
      className,
    )}
    aria-hidden="true"
  />
);
