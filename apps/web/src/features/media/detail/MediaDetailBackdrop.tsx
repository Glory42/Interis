import { cn } from "@/lib/utils";

type MediaDetailBackdropProps = {
  backdropUrl: string | null;
  accentColor?: string;
  className?: string;
};

// A single full-bleed backdrop image behind a detail page's header, faded
// into the page background at the bottom (where the poster/title overlap
// it) via a theme-adaptive gradient. No box/border of its own - this is
// meant to run edge to edge like a cinema still, not sit inside a card.
export const MediaDetailBackdrop = ({
  backdropUrl,
  accentColor = "var(--foreground)",
  className,
}: MediaDetailBackdropProps) => {
  if (!backdropUrl) {
    return null;
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <img src={backdropUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, var(--background) 35%, transparent) 0%, color-mix(in srgb, var(--background) 15%, transparent) 35%, color-mix(in srgb, ${accentColor} 8%, transparent) 55%, var(--background) 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-background/55 via-transparent to-background/55" />
    </div>
  );
};
