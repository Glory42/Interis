import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { ArchiveCardModuleStyles, ArchiveMenuKey } from "@/features/media-archive/types";
import { cn } from "@/lib/utils";

type ArchiveMenuTriggerProps = {
  menu: ArchiveMenuKey;
  openMenu: ArchiveMenuKey | null;
  onToggleMenu: (menu: ArchiveMenuKey) => void;
  icon: ReactNode;
  label: ReactNode;
  menuClassName: string;
  children: ReactNode;
  disabled?: boolean;
  moduleStyles: Pick<ArchiveCardModuleStyles, "accent" | "muted" | "faint" | "border" | "borderSoft" | "panel">;
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
  moduleStyles,
}: ArchiveMenuTriggerProps) => {
  const isOpen = !disabled && openMenu === menu;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        className="inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] transition-colors"
        style={{
          borderColor: disabled
            ? moduleStyles.borderSoft
            : isOpen
              ? moduleStyles.accent
              : moduleStyles.borderSoft,
          color: disabled
            ? moduleStyles.faint
            : isOpen
              ? moduleStyles.accent
              : moduleStyles.muted,
          background: "transparent",
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
            "absolute left-0 top-full z-40 mt-1 overflow-hidden border",
            menuClassName,
          )}
          style={{
            borderColor: moduleStyles.border,
            background: moduleStyles.panel,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};
