import { cn } from "@/lib/utils";

type SlateProps = {
  left: string[];
  right?: string[];
  className?: string;
};

// The black clapperboard strip on cards and dialogs: mono metadata joined by " · ".
export const Slate = ({ left, right = [], className }: SlateProps) => (
  <div className={cn("slate", className)}>
    <span>{left.join(" · ")}</span>
    {right.length > 0 ? <span>{right.join(" · ")}</span> : null}
  </div>
);
