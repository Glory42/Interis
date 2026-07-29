import {
  Film,
  Rss,
  Tv,
  type LucideIcon,
} from "lucide-react";

export type PrimaryNavItem = {
  to: "/" | "/cinema" | "/serials";
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  activeColor?: string;
};

export const primaryNavItems: PrimaryNavItem[] = [
  {
    to: "/",
    label: "FEED",
    icon: Rss,
    exact: true,
    activeColor: "var(--foreground)",
  },
  {
    to: "/cinema",
    label: "CINEMA",
    icon: Film,
    activeColor: "var(--module-cinema)",
  },
  {
    to: "/serials",
    label: "SERIAL",
    icon: Tv,
    activeColor: "var(--module-serial)",
  },
];

export const navLinkClass =
  "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-all duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

export const navLinkActiveClass = "border";

export const getNavLinkActiveStyle = (item: PrimaryNavItem) => {
  const activeColor = item.activeColor ?? "var(--foreground)";

  return {
    color: activeColor,
    borderColor: `color-mix(in srgb, ${activeColor} 42%, transparent)`,
    background: `color-mix(in srgb, ${activeColor} 10%, transparent)`,
  };
};

export const navLinkActiveOptions = {
  includeSearch: false,
} as const;

export const dropdownItemClass =
  "flex w-full items-center rounded-lg px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";
