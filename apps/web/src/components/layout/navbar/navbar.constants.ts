import {
  Film,
  Rss,
  Shield,
  Tv,
  type LucideIcon,
} from "lucide-react";

export type PrimaryNavItem = {
  to: "/" | "/cinema" | "/serials" | "/admin";
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
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
  {
    to: "/admin",
    label: "ADMIN",
    icon: Shield,
    adminOnly: true,
    activeColor: "var(--primary)",
  },
];

export const navLinkClass =
  "inline-flex items-center gap-1.5 border border-transparent px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-all duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

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
  "flex w-full items-center px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";
