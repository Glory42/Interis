import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type ProfileTab = "overview" | "diary" | "films" | "reviews" | "lists";

type ProfileTabsProps = {
  username: string;
  activeTab: ProfileTab;
};

const tabClass =
  "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-all";

export const ProfileTabs = ({ username, activeTab }: ProfileTabsProps) => {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-card/30 p-2">
      <Link
        to="/profile/$username"
        params={{ username }}
        className={cn(
          tabClass,
          activeTab === "overview"
            ? "bg-secondary/90 text-foreground"
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
            ? "bg-secondary/90 text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        resetScroll={false}
        viewTransition
      >
        Diary
      </Link>
      <Link
        to="/profile/$username/films"
        params={{ username }}
        className={cn(
          tabClass,
          activeTab === "films"
            ? "bg-secondary/90 text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        resetScroll={false}
        viewTransition
      >
        Films
      </Link>
      <Link
        to="/profile/$username/reviews"
        params={{ username }}
        className={cn(
          tabClass,
          activeTab === "reviews"
            ? "bg-secondary/90 text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        resetScroll={false}
        viewTransition
      >
        Reviews
      </Link>
      <Link
        to="/profile/$username/lists"
        params={{ username }}
        className={cn(
          tabClass,
          activeTab === "lists"
            ? "bg-secondary/90 text-foreground"
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
