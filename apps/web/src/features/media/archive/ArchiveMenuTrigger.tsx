import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { ArchiveCardModuleStyles, ArchiveMenuKey } from "@/features/media/types";
import { cn } from "@/lib/utils";

type ArchiveMenuTriggerProps = {
  menu: ArchiveMenuKey;
  openMenu: ArchiveMenuKey | null;
  onToggleMenu: (menu: ArchiveMenuKey) => void;
  icon?: ReactNode;
  label: ReactNode;
  menuClassName: string;
  children: ReactNode;
  disabled?: boolean;
  // sentence: a dashed word inside "Showing every genre, trending, …".
  variant?: "chip" | "sentence";
  moduleStyles: Pick<ArchiveCardModuleStyles, "accent" | "muted" | "faint">;
};

export const ArchiveMenuTrigger = ({
  menu,
  openMenu,
  onToggleMenu,
  icon,
  label,
  menuClassName,
  children,
  disabled = false,
  variant = "chip",
  moduleStyles,
}: ArchiveMenuTriggerProps) => {
  const isOpen = !disabled && openMenu === menu;

  if (variant === "sentence") {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => onToggleMenu(menu)}
          className="inline-flex items-baseline gap-0.5 border-b border-dashed text-foreground"
          style={{ borderColor: moduleStyles.accent }}
        >
          {label}
          <ChevronDown aria-hidden className="size-3 self-center text-muted-foreground" />
        </button>
        {isOpen ? (
          <div className={cn("surface-card absolute left-0 top-full z-40 mt-1 overflow-hidden", menuClassName)}>
            {children}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        className="surface-card inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] transition-colors"
        style={{
          borderColor: isOpen ? moduleStyles.accent : undefined,
          color: disabled
            ? moduleStyles.faint
            : isOpen
              ? moduleStyles.accent
              : moduleStyles.muted,
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) {
            onToggleMenu(menu);
          }
        }}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen ? (
        <div
          className={cn(
            "surface-card absolute left-0 top-full z-40 mt-1 overflow-hidden",
            menuClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};
