import {
  Film,
  Rss,
  Tv,
  type LucideIcon,
} from "lucide-react";

export type PrimaryNavItem = {
  to: "/" | "/movies" | "/serials";
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  activeColor?: string;
};

export const primaryNavItems: PrimaryNavItem[] = [
  {
    to: "/",
    label: "Feed",
    icon: Rss,
    exact: true,
    activeColor: "var(--fg)",
  },
  {
    to: "/movies",
    label: "Films",
    icon: Film,
    activeColor: "var(--film)",
  },
  {
    to: "/serials",
    label: "TV",
    icon: Tv,
    activeColor: "var(--series)",
  },
];

export const navLinkActiveOptions = {
  includeSearch: false,
} as const;

export const dropdownItemClass =
  "flex w-full items-center rounded-lg px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

// Detail pages get their own sticky action bar on phones, so the tab bar steps aside there.
const DETAIL_PATH = /^\/(movies|serials)\/[^/]+/;

export const shouldShowTabBar = (pathname: string, isNotGuestLanding: boolean): boolean =>
  isNotGuestLanding && !DETAIL_PATH.test(pathname);
