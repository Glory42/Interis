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
  "whitespace-nowrap border-b-2 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-all";

const activeTabClass = "theme-segment-active";

export const ProfileTabs = ({ username, activeTab }: ProfileTabsProps) => {
  return (
    <nav className="flex items-center gap-0 overflow-x-auto border-b border-border/60">
      <Link
        to="/profile/$username"
        params={{ username }}
          className={cn(
            tabClass,
            activeTab === "overview"
              ? activeTabClass
              : "text-muted-foreground/80 hover:text-foreground",
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
              : "text-muted-foreground/80 hover:text-foreground",
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
              : "text-muted-foreground/80 hover:text-foreground",
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
              : "text-muted-foreground/80 hover:text-foreground",
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
              : "text-muted-foreground/80 hover:text-foreground",
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
              : "text-muted-foreground/80 hover:text-foreground",
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
              : "text-muted-foreground/80 hover:text-foreground",
          )}
        resetScroll={false}
        viewTransition
      >
        Lists
      </Link>
    </nav>
  );
};
