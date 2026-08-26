import type { LucideIcon } from "lucide-react";

// The poster/cover block repeated across every media type's actions sidebar:
// an aspect-ratio frame showing the artwork, or an icon+label placeholder
// when no artwork is available. Rounded corners and the icon badge are the
// shell's own presentation choice, applied uniformly across media types.
export type MediaCoverImageProps = {
  src?: string | null;
  alt: string;
  fallbackIcon: LucideIcon;
  fallbackLabel: string;
  accentColor: string;
  panelColor: string;
  panelStrongColor: string;
  faintColor: string;
  borderColor: string;
  aspectClassName?: string;
};

export const MediaCoverImage = ({
  src,
  alt,
  fallbackIcon: FallbackIcon,
  fallbackLabel,
  accentColor,
  panelColor,
  panelStrongColor,
  faintColor,
  borderColor,
  aspectClassName = "aspect-2/3",
}: MediaCoverImageProps) => {
  return (
    <div
      className={`mb-4 ${aspectClassName} overflow-hidden rounded-xl border`}
      style={{ borderColor }}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2"
          style={{ background: panelColor }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center"
            style={{ background: panelStrongColor }}
          >
            <FallbackIcon className="h-4 w-4" style={{ color: accentColor }} />
          </div>
          <span
            className="font-mono text-[8px] uppercase tracking-[0.22em]"
            style={{ color: faintColor }}
          >
            {fallbackLabel}
          </span>
        </div>
      )}
    </div>
  );
};
