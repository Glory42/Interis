import { Link, useRouterState } from "@tanstack/react-router";
import { CircleUser, Film, LogIn, Rss, Tv, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { isSectionActive, useSlidingMarker } from "@/components/layout/navbar/use-sliding-marker";

const itemClass =
  "flex min-h-11 flex-col items-center justify-center gap-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#8a8a8a] uppercase transition-colors duration-300";

type Tab = {
  key: string;
  to: "/" | "/movies" | "/serials" | "/login" | "/profile/$username";
  path: string;
  params?: { username: string };
  label: string;
  icon: LucideIcon;
  color: string;
  exact?: boolean;
};

const tabsFor = (username: string | null): Tab[] => [
  { key: "feed", to: "/", path: "/", label: "Feed", icon: Rss, color: "#eeeeee", exact: true },
  { key: "films", to: "/movies", path: "/movies", label: "Films", icon: Film, color: "var(--film)" },
  { key: "tv", to: "/serials", path: "/serials", label: "TV", icon: Tv, color: "var(--series)" },
  username
    ? { key: "you", to: "/profile/$username", path: `/profile/${username}`, params: { username }, label: "You", icon: CircleUser, color: "#eeeeee" }
    : { key: "signin", to: "/login", path: "/login", label: "Sign in", icon: LogIn, color: "#eeeeee" },
];

// Phones only (D2): four 44px targets; logging happens on each title's page.
export const MobileTabBar = ({ username }: { username: string | null }) => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const tabs = tabsFor(username);
  const activeTab = tabs.find((tab) => isSectionActive(pathname, tab.path, tab.exact)) ?? null;
  const { markerRef, register } = useSlidingMarker(activeTab?.key ?? null);

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[color:var(--line)] bg-[color:var(--slate)] pb-[env(safe-area-inset-bottom)] [view-transition-name:tabbar] md:hidden"
    >
      {tabs.map(({ key, to, params, label, icon: Icon, color, exact = false }) => (
        <Link
          key={key}
          ref={register(key)}
          to={to}
          params={params}
          className={itemClass}
          activeProps={{ style: { color } as CSSProperties }}
          activeOptions={{ exact, includeSearch: false }}
          viewTransition
        >
          <Icon aria-hidden className="size-4" />
          {label}
        </Link>
      ))}
      <span
        ref={markerRef}
        aria-hidden
        data-testid="tab-marker"
        className="pointer-events-none absolute opacity-0 -top-px left-0 h-0.5 transition-[transform,width,background-color,opacity] duration-300 ease-in-out motion-reduce:transition-none"
        style={{ background: activeTab?.color ?? "var(--fg)" }}
      />
    </nav>
  );
};
