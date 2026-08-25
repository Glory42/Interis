import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  Heart,
  List,
  PlayCircle,
  Star,
  User,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

export type ProfileTab =
  | "overview"
  | "diary"
  | "watching"
  | "watchlist"
  | "liked"
  | "reviews"
  | "lists"
  | "stats";

type ProfileTabsProps = {
  username: string;
  activeTab: ProfileTab;
};

const tabClass =
  "relative z-10 flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors";

const tabItems: Array<{
  id: ProfileTab;
  label: string;
  to:
    | "/profile/$username"
    | "/profile/$username/diary"
    | "/profile/$username/watching"
    | "/profile/$username/reviews"
    | "/profile/$username/lists"
    | "/profile/$username/liked"
    | "/profile/$username/watchlist"
    | "/profile/$username/stats";
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
    id: "watching",
    label: "Watching",
    to: "/profile/$username/watching",
    icon: PlayCircle,
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
  {
    id: "stats",
    label: "Stats",
    to: "/profile/$username/stats",
    icon: BarChart3,
  },
];

type IndicatorRect = { left: number; width: number };

export const ProfileTabs = ({ username, activeTab }: ProfileTabsProps) => {
  const tabRefs = useRef<Partial<Record<ProfileTab, HTMLAnchorElement>>>({});
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  useLayoutEffect(() => {
    const activeElement = tabRefs.current[activeTab];
    if (activeElement) {
      setIndicator({ left: activeElement.offsetLeft, width: activeElement.offsetWidth });
    }
  }, [activeTab]);

  return (
    <nav className="relative flex gap-0 overflow-x-auto" aria-label="Profile sections">
      {indicator ? (
        <div
          className="absolute bottom-0 h-0.5 transition-[transform,width] duration-300 ease-in-out"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
            background: "var(--profile-shell-accent)",
          }}
        />
      ) : null}

      {tabItems.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            ref={(el) => {
              if (el) {
                tabRefs.current[tab.id] = el;
              }
            }}
            to={tab.to}
            params={{ username }}
            className={tabClass}
            style={{ color: isActive ? "var(--profile-shell-accent)" : "var(--profile-shell-muted)" }}
            resetScroll={false}
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
