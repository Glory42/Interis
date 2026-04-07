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
};

export const ArchiveMenuTrigger = ({
  menu,
  openMenu,
  onToggleMenu,
  icon,
  label,
  menuClassName,
  children,
}: ArchiveMenuTriggerProps) => {
  const isOpen = openMenu === menu;

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] transition-colors"
        style={{
          borderColor: isOpen ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft,
          color: isOpen ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
          background: "transparent",
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => onToggleMenu(menu)}
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
