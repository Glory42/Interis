import { Fragment } from "react";
import { Menu, type MenuOption } from "@/components/ui/menu";

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
        <Menu
          key={part.key}
          ariaLabel={`${part.label}: ${current}`}
          trigger={current}
          triggerClassName="border-b border-dashed border-primary text-foreground"
          options={part.options}
          value={part.value}
          onSelect={part.onChange}
        />
      );
    })}
  </p>
);
