import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FoldedName = { key: string; node: ReactNode };

type FeedFoldedNamesProps = {
  names: FoldedName[];
  expanded: boolean;
  onToggle: () => void;
  className?: string;
};

// How many children sit on the list's first line.
const countFirstLine = (list: HTMLElement): number => {
  const children = Array.from(list.children) as HTMLElement[];
  const top = children[0]?.offsetTop ?? 0;
  return children.filter((child) => Math.abs(child.offsetTop - top) < 2).length;
};

// A folded run's names on one line, as many as fit, then "+N more" to list them all.
export const FeedFoldedNames = ({ names, expanded, onToggle, className }: FeedFoldedNamesProps) => {
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [fitCount, setFitCount] = useState(names.length);

  // Measuring the laid-out line is a DOM side effect; it re-runs as the row resizes.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || expanded) return;
    const measure = () => setFitCount(Math.max(1, countFirstLine(list)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [expanded, names.length]);

  const hidden = expanded ? 0 : Math.max(0, names.length - fitCount);

  return (
    <div className={cn("flex min-w-0 items-start gap-1.5", className)}>
      <ul id={listId} ref={listRef} className={cn("flex min-w-0 flex-1 flex-wrap gap-x-1", !expanded && "h-[1lh] overflow-hidden")}>
        {names.map((name, index) => (
          <li key={name.key} className={cn("min-w-0 max-w-full truncate", !expanded && index >= fitCount && "invisible")}>
            {name.node}
            {index < names.length - 1 ? "," : null}
          </li>
        ))}
      </ul>
      {hidden > 0 || expanded ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={onToggle}
          className="shrink-0 whitespace-nowrap text-foreground underline decoration-[color:var(--line-strong)] underline-offset-2 hover:text-primary"
        >
          {expanded ? "Show less" : `+${hidden} more`}
        </button>
      ) : null}
    </div>
  );
};
