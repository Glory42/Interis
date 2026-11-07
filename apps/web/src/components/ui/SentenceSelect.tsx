import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SentenceOption<T extends string> = {
  value: T;
  // The word shown inside the sentence ("films and series").
  word: string;
  // The menu entry ("Films and series · 94").
  label: string;
};

type SentenceSelectProps<T extends string> = {
  value: T;
  options: ReadonlyArray<SentenceOption<T>>;
  onChange: (value: T) => void;
};

// A dashed word inside a filter sentence that opens a short menu ("Showing every genre ▾ …").
export const SentenceSelect = <T extends string>({ value, options, onChange }: SentenceSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <span
      className="relative inline-block"
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setIsOpen(false)}
      onKeyDown={(event) => event.key === "Escape" && setIsOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-baseline gap-0.5 border-b border-dashed border-[color:var(--primary)] text-foreground"
      >
        {current?.word}
        <ChevronDown aria-hidden className="size-3 self-center text-muted-foreground" />
      </button>
      {isOpen ? (
        <span role="menu" className="surface-card absolute top-full left-0 z-40 mt-1 block min-w-40 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "block w-full whitespace-nowrap px-4 py-2 text-left font-mono text-[11px]",
                option.value === value ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
};
