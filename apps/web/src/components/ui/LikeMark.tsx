import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

// SVG heart sized to the text: iOS Safari swaps the "♥" glyph for its red emoji.
export const LikeMark = ({ className }: { className?: string }) => (
  <Heart
    role="img"
    aria-label="Liked"
    className={cn("inline-block size-[0.9em] shrink-0 fill-current align-[-0.1em] text-[color:var(--like)]", className)}
  />
);
