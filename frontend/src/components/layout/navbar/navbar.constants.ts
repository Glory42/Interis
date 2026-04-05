import {
  BookOpen,
  Film,
  Headphones,
  Rss,
  Shield,
  Tv,
  type LucideIcon,
} from "lucide-react";

export type PrimaryNavItem = {
  to: "/" | "/cinema" | "/serials" | "/codex" | "/echoes" | "/admin";
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
};

export const primaryNavItems: PrimaryNavItem[] = [
  {
    to: "/",
    label: "FEED",
    icon: Rss,
    exact: true,
  },
  {
    to: "/cinema",
    label: "CINEMA",
    icon: Film,
  },
  {
    to: "/serials",
    label: "SERIAL",
    icon: Tv,
  },
  {
    to: "/codex",
    label: "CODEX",
    icon: BookOpen,
  },
  {
    to: "/echoes",
    label: "ECHOES",
    icon: Headphones,
  },
  {
    to: "/admin",
    label: "ADMIN",
    icon: Shield,
    adminOnly: true,
  },
];

export const navLinkClass =
  "inline-flex items-center gap-1.5 border border-transparent px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-all duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

export const navLinkActiveClass =
  "theme-nav-pill-active border-border/70 bg-card/35 text-foreground";

export const navLinkActiveOptions = {
  includeSearch: false,
} as const;

export const dropdownItemClass =
  "flex w-full items-center px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";
