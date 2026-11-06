import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MenuOption<T extends string> = { value: T; label: string };

type MenuProps<T extends string> = {
  // Accessible name of the trigger, e.g. "Sort: newest first".
  ariaLabel: string;
  trigger: ReactNode;
  triggerClassName?: string;
  options: MenuOption<T>[];
  value: T;
  onSelect: (value: T) => void;
};

// Hairline popover with no blur; closes on pick, Escape or an outside click.
export const Menu = <T extends string>({
  ariaLabel,
  trigger,
  triggerClassName,
  options,
  value,
  onSelect,
}: MenuProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <span ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {isOpen ? (
        <span
          id={listId}
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 flex min-w-44 flex-col rounded-lg border border-[color:var(--line-strong)] bg-card py-1 text-[12.5px] shadow-[0_18px_40px_-20px_rgb(0_0_0)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "min-h-11 px-3 py-1.5 text-left text-foreground transition-colors hover:bg-foreground/5 sm:min-h-0",
                  isSelected && "bg-foreground/5 shadow-[inset_2px_0_var(--primary)]",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </span>
      ) : null}
    </span>
  );
};
