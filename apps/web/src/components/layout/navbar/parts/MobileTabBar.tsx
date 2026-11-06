import { Link } from "@tanstack/react-router";
import { CircleUser, Film, LogIn, PenLine, Rss, Tv, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useGlobalSearchDialog } from "@/features/search/components/useGlobalSearchDialog";

const itemClass =
  "flex min-h-11 flex-col items-center justify-center gap-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#8a8a8a] uppercase";

const TabLink = ({
  to,
  params,
  label,
  icon: Icon,
  color,
  exact = false,
}: {
  to: "/" | "/movies" | "/serials" | "/login" | "/profile/$username";
  params?: { username: string };
  label: string;
  icon: LucideIcon;
  color: string;
  exact?: boolean;
}) => (
  <Link
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
);

// Phones only (D2): five 44px targets with Log in the centre; replaces the ☰ menu.
export const MobileTabBar = ({ username }: { username: string | null }) => {
  const { open: openSearch } = useGlobalSearchDialog();

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[color:var(--line)] bg-[color:var(--slate)] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <TabLink to="/" label="Feed" icon={Rss} color="#eeeeee" exact />
      <TabLink to="/movies" label="Films" icon={Film} color="var(--film)" />
      <button type="button" onClick={openSearch} className={`${itemClass} text-primary`}>
        <PenLine aria-hidden className="size-4" />
        Log
      </button>
      <TabLink to="/serials" label="TV" icon={Tv} color="var(--series)" />
      {username ? (
        <TabLink to="/profile/$username" params={{ username }} label="You" icon={CircleUser} color="#eeeeee" />
      ) : (
        <TabLink to="/login" label="Sign in" icon={LogIn} color="#eeeeee" />
      )}
    </nav>
  );
};
