import {
  BookText,
  Film,
  Radio,
  Shield,
  TrendingUp,
  Tv,
  type LucideIcon,
} from "lucide-react";

export type PrimaryNavItem = {
  to: "/" | "/films" | "/serials" | "/codex" | "/echoes" | "/admin";
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
};

export const primaryNavItems: PrimaryNavItem[] = [
  {
    to: "/",
    label: "Feed",
    icon: TrendingUp,
    exact: true,
  },
  {
    to: "/films",
    label: "Cinema",
    icon: Film,
  },
  {
    to: "/serials",
    label: "Serials",
    icon: Tv,
  },
  {
    to: "/codex",
    label: "Codex",
    icon: BookText,
  },
  {
    to: "/echoes",
    label: "Echoes",
    icon: Radio,
  },
  {
    to: "/admin",
    label: "Admin",
    icon: Shield,
    adminOnly: true,
  },
];

export const navLinkClass =
  "inline-flex items-center gap-2 rounded-lg border border-background/85 px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/60";

export const navLinkActiveClass = "border-primary/45 bg-primary/12 text-primary";

export const navLinkActiveOptions = {
  includeSearch: false,
} as const;

export const dropdownItemClass =
  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";
