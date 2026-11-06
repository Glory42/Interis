import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneTint = {
  film: "var(--film)",
  series: "var(--series)",
  neutral: "var(--primary)",
} as const;

type DuotoneBackdropProps = {
  tone?: keyof typeof toneTint;
  // Overrides the tone, e.g. a module accent variable.
  tintColor?: string;
  // Fade into the page background at the bottom so text on top stays readable.
  fade?: boolean;
  className?: string;
  children?: ReactNode;
};

// Grayscale image(s) tinted in the film/TV colour with the theme's grain;
// themes add their touch in CSS (NULL://LOG scanlines, Nitrate sprocket edges).
export const DuotoneBackdrop = ({
  tone = "neutral",
  tintColor,
  fade = true,
  className,
  children,
}: DuotoneBackdropProps) => (
  <div
    aria-hidden="true"
    className={cn("duotone absolute inset-0 overflow-hidden", className)}
    style={{ "--duotone-tint": tintColor ?? toneTint[tone] } as CSSProperties}
  >
    <div className="duotone-media absolute inset-0">{children}</div>
    <div className="duotone-tint absolute inset-0" />
    <div className="duotone-grain absolute inset-0" />
    {fade ? <div className="duotone-fade absolute inset-0" /> : null}
  </div>
);
