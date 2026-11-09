import { Fragment } from "react";
import type { MenuOption } from "@/components/ui/menu";
import { SentenceSelect } from "@/components/ui/SentenceSelect";

export type SentencePhrase = {
  key: string;
  // Names the choice for screen readers, e.g. "Sort".
  label: string;
  value: string;
  options: MenuOption<string>[];
  onChange: (value: string) => void;
};

type SentenceFilterProps = {
  parts: (string | SentencePhrase)[];
  className?: string;
};

// "Showing films from every year, newest first." — each underlined phrase opens a menu.
export const SentenceFilter = ({ parts, className }: SentenceFilterProps) => (
  <p className={className ?? "text-[13px] leading-[1.7] text-muted-foreground"}>
    {parts.map((part, index) => {
      if (typeof part === "string") {
        return <Fragment key={`text-${index}`}>{part}</Fragment>;
      }

      const current = part.options.find((option) => option.value === part.value)?.label ?? part.value;
      return (
        <SentenceSelect
          key={part.key}
          ariaLabel={`${part.label}: ${current}`}
          value={part.value}
          options={part.options.map((option) => ({ ...option, word: option.label }))}
          onChange={part.onChange}
        />
      );
    })}
  </p>
);
