import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FeedFilter } from "@/features/feed/types";
import { cn } from "@/lib/utils";

const options: { value: FeedFilter; label: string; word: string }[] = [
  { value: "all", label: "Everything", word: "everything" },
  { value: "movie", label: "Films", word: "films" },
  { value: "serial", label: "TV", word: "TV" },
];

// "Showing everything from people you follow." The underlined word picks films or TV.
export const FeedFilterSentence = ({ filter, onChange }: { filter: FeedFilter; onChange: (filter: FeedFilter) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find((option) => option.value === filter) ?? options[0]!;

  return (
    <div className="body-s text-muted-foreground" onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setIsOpen(false)}>
      {"Showing "}
      <span className="relative inline-block">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex items-baseline gap-0.5 border-b border-dashed border-[color:var(--primary)] text-foreground"
        >
          {current.word}
          <ChevronDown aria-hidden className="size-3 self-center text-muted-foreground" />
        </button>
        {isOpen ? (
          <span role="menu" className="surface-card absolute top-full left-0 z-40 mt-1 block min-w-32 overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={option.value === filter}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "block w-full px-4 py-2 text-left font-mono text-[11px]",
                  option.value === filter ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </span>
        ) : null}
      </span>
      {" from people you follow."}
    </div>
  );
};
