import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  CalendarDays,
  Heart,
  List,
  Star,
  User,
} from "lucide-react";

export type ProfileTab =
  | "overview"
  | "diary"
  | "watchlist"
  | "liked"
  | "reviews"
  | "lists";

type ProfileTabsProps = {
  username: string;
  activeTab: ProfileTab;
};

const tabClass =
  "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors";

const activeTabStyle = {
  borderBottomColor: "var(--profile-shell-accent)",
  color: "var(--profile-shell-accent)",
  marginBottom: "-1px",
} as const;

const inactiveTabStyle = {
  borderBottomColor: "transparent",
  color: "var(--profile-shell-muted)",
  marginBottom: "-1px",
} as const;

const tabItems: Array<{
  id: ProfileTab;
  label: string;
  to:
    | "/profile/$username"
    | "/profile/$username/diary"
    | "/profile/$username/reviews"
    | "/profile/$username/lists"
    | "/profile/$username/liked"
    | "/profile/$username/watchlist";
  icon: typeof User;
}> = [
  { id: "overview", label: "Overview", to: "/profile/$username", icon: User },
  {
    id: "diary",
    label: "Diary",
    to: "/profile/$username/diary",
    icon: CalendarDays,
  },
  {
    id: "reviews",
    label: "Reviews",
    to: "/profile/$username/reviews",
    icon: Star,
  },

  {
    id: "liked",
    label: "Likes",
    to: "/profile/$username/liked",
    icon: Heart,
  },
  {
    id: "watchlist",
    label: "Watchlist",
    to: "/profile/$username/watchlist",
    icon: Bookmark,
  },
  {
    id: "lists",
    label: "Lists",
    to: "/profile/$username/lists",
    icon: List,
  },
];

export const ProfileTabs = ({ username, activeTab }: ProfileTabsProps) => {
  return (
    <nav className="mb-8 flex gap-0 overflow-x-auto border-b profile-shell-border">
      {tabItems.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            to={tab.to}
            params={{ username }}
            className={tabClass}
            style={isActive ? activeTabStyle : inactiveTabStyle}
            resetScroll={false}
            viewTransition
            aria-label={tab.label}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
