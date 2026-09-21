import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";

const RATING_OPTIONS = [
  0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
];

type RatingSelectProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: "season" | "episode";
};

type MenuPosition = { top: number; left: number };

// A small self-contained themed dropdown (own open state + outside-click
// handling) instead of a native <select> - browsers render a native
// <select>'s option list with OS chrome that ignores our theme entirely,
// which is what looked out of place here. The option panel is portaled to
// document.body and positioned from the trigger's bounding rect, since
// this control sits inside an `overflow-hidden` accordion card that would
// otherwise clip an absolutely-positioned dropdown (most visibly when the
// season row is collapsed, leaving zero room below it to render into).
export const RatingSelect = ({ value, onChange, size = "season" }: RatingSelectProps) => {
  const isEpisode = size === "episode";
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({ top: rect.bottom + 4, left: rect.left });
    }
    setIsOpen(true);
  };

  const select = (nextValue: number | null) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        className={cn(
          "flex items-center gap-1 rounded-full border bg-background/30 px-1.5 font-mono text-muted-foreground transition-colors",
          isEpisode ? "h-6 text-[8px]" : "h-7 text-[9px]",
        )}
        style={{ borderColor: isOpen ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft }}
      >
        <Star
          className={isEpisode ? "h-2.5 w-2.5" : "h-3 w-3"}
          style={{ color: SERIAL_MODULE_STYLES.accent }}
        />
        <span>{value !== null ? value.toFixed(1) : "--"}</span>
        <ChevronDown className={isEpisode ? "h-2 w-2" : "h-2.5 w-2.5"} />
      </button>

      {isOpen && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-150 max-h-48 w-20 overflow-y-auto rounded-lg border"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                borderColor: SERIAL_MODULE_STYLES.border,
                background: SERIAL_MODULE_STYLES.panel,
              }}
            >
              <button
                type="button"
                onClick={() => select(null)}
                className="flex w-full items-center gap-1 px-2 py-1 text-left font-mono text-[9px] transition-colors hover:bg-secondary/40"
                style={{ color: value === null ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted }}
              >
                <Star className="h-2.5 w-2.5" />
                <span>--</span>
              </button>

              {RATING_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => select(option)}
                  className="flex w-full items-center gap-1 px-2 py-1 text-left font-mono text-[9px] transition-colors hover:bg-secondary/40"
                  style={{ color: value === option ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted }}
                >
                  <Star className="h-2.5 w-2.5" />
                  <span>{option.toFixed(1)}</span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
