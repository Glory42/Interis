import { ChevronDown } from "lucide-react";
import { Menu } from "@/components/ui/menu";

export type SentenceOption<T extends string> = {
  value: T;
  // The word shown inside the sentence ("films and series").
  word: string;
  // The menu entry ("Films and series · 94").
  label: string;
  // Muted metadata shown right-aligned in the menu, e.g. "⌘1" or a count.
  hint?: string;
};

type SentenceSelectProps<T extends string> = {
  value: T;
  options: ReadonlyArray<SentenceOption<T>>;
  onChange: (value: T) => void;
  // Names the choice for screen readers, e.g. "Sort: newest first". Defaults to the word.
  ariaLabel?: string;
  // CSS colour of the dashed underline and selected marker, e.g. "var(--film)".
  accent?: string;
};

// A dashed word inside a filter sentence that opens a short menu ("Showing every genre ▾ …").
export const SentenceSelect = <T extends string>({ value, options, onChange, ariaLabel, accent }: SentenceSelectProps<T>) => {
  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <Menu
      ariaLabel={ariaLabel}
      accent={accent}
      trigger={
        <>
          {current?.word}
          <ChevronDown aria-hidden className="size-3 self-center text-muted-foreground" />
        </>
      }
      triggerClassName="inline-flex items-baseline gap-0.5 border-b border-dashed border-[color:var(--menu-accent)] text-foreground"
      options={options}
      value={value}
      onSelect={onChange}
    />
  );
};
