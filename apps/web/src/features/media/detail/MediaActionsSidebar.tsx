import type { ReactNode } from "react";
import type { MediaModuleStyles } from "@/features/media/styles";

export type MediaAction = {
  key: string;
  isActive: boolean;
  activeIcon: ReactNode;
  inactiveIcon: ReactNode;
  activeLabel: string;
  inactiveLabel: string;
  onToggle: () => void;
};

type MediaActionsSidebarProps = {
  moduleStyles: MediaModuleStyles;
  posterSlot: ReactNode;
  // The action card (and any panels under it); phones show these in the main column instead.
  children?: ReactNode;
};

// Desktop only: the poster with the viewer's actions under it.
export const MediaActionsSidebar = ({ moduleStyles, posterSlot, children }: MediaActionsSidebarProps) => (
  <aside className="hidden md:block">
    <div className="mb-4 aspect-2/3 overflow-hidden rounded-xl border" style={{ borderColor: moduleStyles.border }}>
      {posterSlot}
    </div>
    <div className="space-y-3">{children}</div>
  </aside>
);
