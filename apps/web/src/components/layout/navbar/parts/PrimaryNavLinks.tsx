import { Link } from "@tanstack/react-router";
import {
  navLinkActiveOptions,
  type PrimaryNavItem,
} from "@/components/layout/navbar/navbar.constants";

type PrimaryNavLinksProps = {
  items: PrimaryNavItem[];
  pathname?: string;
};

// Flat kicker links (desktop), the active one underlined in its film/TV colour.
const linkClass =
  "relative inline-flex h-14 items-center px-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary";

export const PrimaryNavLinks = ({ items }: PrimaryNavLinksProps) =>
  items.map((item) => {
    const activeColor = item.activeColor ?? "var(--fg)";

    return (
      <Link
        key={item.to}
        to={item.to}
        viewTransition
        className={linkClass}
        activeProps={{ style: { color: activeColor, boxShadow: `inset 0 -2px ${activeColor}` } }}
        activeOptions={item.exact ? { ...navLinkActiveOptions, exact: true } : navLinkActiveOptions}
      >
        {item.label}
      </Link>
    );
  });
