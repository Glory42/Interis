import { useCallback, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { MenuPanel, type MenuOption } from "@/components/ui/MenuPanel";

export type { MenuOption };

type MenuProps<T extends string> = {
  // Accessible name of the trigger, e.g. "Sort: newest first". Defaults to the trigger's text.
  ariaLabel?: string;
  trigger: ReactNode;
  triggerClassName?: string;
  options: ReadonlyArray<MenuOption<T>>;
  value: T;
  onSelect: (value: T) => void;
  // CSS colour exposed to the trigger and panel as --menu-accent. Defaults to the primary colour.
  accent?: string;
};

// A button that opens a single-choice menu. Arrow keys, Home/End and typing move between options,
// Enter/Space picks, Escape or Tab closes and returns focus to the trigger.
export const Menu = <T extends string>({
  ariaLabel,
  trigger,
  triggerClassName,
  options,
  value,
  onSelect,
  accent = "var(--primary)",
}: MenuProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const triggerId = useId();
  const panelId = useId();

  const close = useCallback((returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        style={{ "--menu-accent": accent } as CSSProperties}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {isOpen ? (
        <MenuPanel
          id={panelId}
          anchorRef={triggerRef}
          labelledBy={triggerId}
          options={options}
          value={value}
          accent={accent}
          onPick={(next) => {
            // Focus goes back first so onSelect can move it elsewhere (e.g. a search input).
            close(true);
            onSelect(next);
          }}
          onDismiss={close}
        />
      ) : null}
    </>
  );
};
