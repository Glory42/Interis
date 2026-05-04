import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-archive/constants";
import type { OpenMenu } from "@/features/serials/components/serial-archive/types";
import { cn } from "@/lib/utils";

type ArchiveMenuTriggerProps = {
  menu: Exclude<OpenMenu, null>;
  openMenu: OpenMenu;
  onToggleMenu: (menu: Exclude<OpenMenu, null>) => void;
  icon: ReactNode;
  label: ReactNode;
  menuClassName: string;
  children: ReactNode;
  disabled?: boolean;
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
            ? SERIAL_MODULE_STYLES.borderSoft
            : isOpen
              ? SERIAL_MODULE_STYLES.accent
              : SERIAL_MODULE_STYLES.borderSoft,
          color: disabled
            ? SERIAL_MODULE_STYLES.faint
            : isOpen
              ? SERIAL_MODULE_STYLES.accent
              : SERIAL_MODULE_STYLES.muted,
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
            borderColor: SERIAL_MODULE_STYLES.border,
            background: SERIAL_MODULE_STYLES.panel,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};
