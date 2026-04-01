import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type ProfileTab =
  | "overview"
  | "diary"
  | "cinema"
  | "watchlist"
  | "liked"
  | "reviews"
  | "lists";

type ProfileTabsProps = {
  username: string;
  activeTab: ProfileTab;
};

const tabClass =
  "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-all";

const activeTabClass = "theme-segment-active";

export const ProfileTabs = ({ username, activeTab }: ProfileTabsProps) => {
  return (
    <nav className="theme-segment-shell flex items-center gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-card/30 p-2">
      <Link
        to="/profile/$username"
        params={{ username }}
          className={cn(
            tabClass,
            activeTab === "overview"
              ? activeTabClass
              : "text-muted-foreground hover:text-foreground",
          )}
        resetScroll={false}
        viewTransition
      >
        Overview
      </Link>
      <Link
        to="/profile/$username/diary"
        params={{ username }}
          className={cn(
            tabClass,
            activeTab === "diary"
              ? activeTabClass
              : "text-muted-foreground hover:text-foreground",
          )}
        resetScroll={false}
        viewTransition
      >
        Diary
      </Link>
      <Link
        to="/profile/$username/cinema"
        params={{ username }}
          className={cn(
            tabClass,
            activeTab === "cinema"
              ? activeTabClass
              : "text-muted-foreground hover:text-foreground",
          )}
        resetScroll={false}
        viewTransition
      >
        Cinema
      </Link>
      <Link
        to="/profile/$username/reviews"
        params={{ username }}
          className={cn(
            tabClass,
            activeTab === "reviews"
              ? activeTabClass
              : "text-muted-foreground hover:text-foreground",
          )}
        resetScroll={false}
        viewTransition
      >
        Reviews
      </Link>
      <Link
        to="/profile/$username/watchlist"
        params={{ username }}
          className={cn(
            tabClass,
            activeTab === "watchlist"
              ? activeTabClass
              : "text-muted-foreground hover:text-foreground",
          )}
        resetScroll={false}
        viewTransition
      >
        Watchlist
      </Link>
      <Link
        to="/profile/$username/liked"
        params={{ username }}
          className={cn(
            tabClass,
            activeTab === "liked"
              ? activeTabClass
              : "text-muted-foreground hover:text-foreground",
          )}
        resetScroll={false}
        viewTransition
      >
        Liked
      </Link>
      <Link
        to="/profile/$username/lists"
        params={{ username }}
          className={cn(
            tabClass,
            activeTab === "lists"
              ? activeTabClass
              : "text-muted-foreground hover:text-foreground",
          )}
        resetScroll={false}
        viewTransition
      >
        Lists
      </Link>
    </nav>
  );
};
