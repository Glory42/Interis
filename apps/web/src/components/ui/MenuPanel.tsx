import { useEffect, useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { placeMenuPanel } from "@/components/ui/menu-placement";
import { cn } from "@/lib/utils";

export type MenuOption<T extends string> = {
  value: T;
  label: string;
  // Muted metadata on the right, e.g. a count or a "⌘1" shortcut.
  hint?: string;
};

type MenuPanelProps<T extends string> = {
  id: string;
  anchorRef: RefObject<HTMLElement | null>;
  labelledBy: string;
  options: ReadonlyArray<MenuOption<T>>;
  value: T;
  // CSS colour for the selected marker and check.
  accent: string;
  onPick: (value: T) => void;
  // returnFocus hands focus back to the trigger (keyboard dismissals).
  onDismiss: (returnFocus: boolean) => void;
};

const ITEM_SELECTOR = '[role="menuitemradio"]';

// Portaled to <body> with fixed positioning so overflow-hidden dialogs can't clip it; sits above
// modals (z-140/150) and below toasts (z-160). data-no-focus-lock lets focus in past a ModalShell lock.
export const MenuPanel = <T extends string>({
  id,
  anchorRef,
  labelledBy,
  options,
  value,
  accent,
  onPick,
  onDismiss,
}: MenuPanelProps<T>) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const getItems = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel || !anchor) return;

    let frame = 0;
    const place = () => {
      panel.style.minWidth = `${anchor.offsetWidth}px`;
      const naturalHeight = panel.scrollHeight + panel.offsetHeight - panel.clientHeight;
      const { top, left, maxHeight } = placeMenuPanel(
        anchor.getBoundingClientRect(),
        { width: panel.offsetWidth, height: naturalHeight },
        { width: document.documentElement.clientWidth, height: window.innerHeight },
      );
      Object.assign(panel.style, { top: `${top}px`, left: `${left}px`, maxHeight: `${maxHeight}px` });
    };
    const schedule = (event: Event) => {
      if (event.target instanceof Node && panel.contains(event.target)) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(place);
    };

    place();
    const items = Array.from(panel.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
    (items.find((item) => item.getAttribute("aria-checked") === "true") ?? items[0])?.focus();

    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onDismiss(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [anchorRef, onDismiss]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = getItems();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (next: number) => items[(next + items.length) % items.length]?.focus();

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Home":
      case "End":
        event.preventDefault();
        if (event.key === "ArrowDown") focusAt(index + 1);
        else if (event.key === "ArrowUp") focusAt(index < 0 ? -1 : index - 1);
        else focusAt(event.key === "Home" ? 0 : -1);
        return;
      case "Enter":
      case " ": {
        event.preventDefault();
        const option = options[index];
        if (option) onPick(option.value);
        return;
      }
      case "Escape":
      case "Tab":
        // Stops here so a surrounding ModalShell doesn't close too; focus lands back on the trigger.
        event.preventDefault();
        event.stopPropagation();
        onDismiss(true);
        return;
      default: {
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
        const key = event.key.toLowerCase();
        const order = items.map((_, offset) => (index + 1 + offset) % items.length);
        const match = order.find((at) => options[at]?.label.toLowerCase().startsWith(key));
        if (match !== undefined) items[match]?.focus();
      }
    }
  };

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role="menu"
      aria-labelledby={labelledBy}
      data-no-focus-lock="true"
      onKeyDown={handleKeyDown}
      // Clicks never move focus out of the panel; hovering moves it between items.
      onMouseDown={(event) => event.preventDefault()}
      style={{ "--menu-accent": accent } as CSSProperties}
      className="fixed top-0 left-0 z-155 flex max-w-[calc(100vw-1rem)] min-w-44 animate-[fade-only_120ms_ease-out] flex-col overflow-y-auto overscroll-contain rounded-[4px] border border-[color:var(--line-strong)] bg-[color:var(--surface)] py-1 text-[13px] leading-snug text-foreground shadow-[var(--theme-navbar-shadow)]"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <div
            key={option.value}
            role="menuitemradio"
            aria-checked={isSelected}
            tabIndex={-1}
            onClick={() => onPick(option.value)}
            onPointerMove={(event) => {
              if (document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true });
            }}
            className={cn(
              "flex min-h-11 shrink-0 cursor-pointer items-center gap-3 px-3 outline-none transition-colors select-none focus:bg-foreground/7 sm:min-h-9",
              isSelected && "bg-foreground/4 font-medium shadow-[inset_2px_0_var(--menu-accent)]",
            )}
          >
            <span className="flex-1 whitespace-nowrap">{option.label}</span>
            {option.hint ? (
              <>
                {" "}
                <span className="font-mono text-[10.5px] tracking-wide text-muted-foreground">{option.hint}</span>
              </>
            ) : null}
            <Check
              aria-hidden
              className={cn("size-3.5 shrink-0 text-[color:var(--menu-accent)]", isSelected ? "visible" : "invisible")}
            />
          </div>
        );
      })}
    </div>,
    document.body,
  );
};
