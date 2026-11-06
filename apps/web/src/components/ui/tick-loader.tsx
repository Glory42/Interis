import { cn } from "@/lib/utils";

type TickLoaderProps = {
  className?: string;
  // With a label it announces itself as a status; without one it's decorative,
  // like the icon it replaces inside a busy button.
  label?: string;
};

// Three reel ticks that pulse in turn; replaces spinners. Sized by font-size, coloured by currentColor.
export const TickLoader = ({ className, label }: TickLoaderProps) => (
  <span
    role={label ? "status" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn("inline-flex items-center gap-0.5", className)}
  >
    {[0, 1, 2].map((tick) => (
      <i
        key={tick}
        className="h-[0.8em] w-[3px] animate-pulse bg-current"
        style={{ animationDelay: `${tick * 150}ms` }}
      />
    ))}
  </span>
);
