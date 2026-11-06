import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  getNavLinkActiveStyle,
  navLinkActiveClass,
  navLinkActiveOptions,
  navLinkClass,
  type PrimaryNavItem,
} from "@/components/layout/navbar/navbar.constants";

type PrimaryNavLinksProps = {
  items: PrimaryNavItem[];
  mobile?: boolean;
  onNavigate?: () => void;
  pathname?: string;
};

// Desktop: flat kicker links, the active one underlined in its film/TV colour.
const desktopLinkClass =
  "relative inline-flex h-14 items-center px-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary";

export const PrimaryNavLinks = ({ items, mobile = false, onNavigate }: PrimaryNavLinksProps) =>
  items.map((item) => {
    const Icon = item.icon;
    const activeColor = item.activeColor ?? "var(--fg)";

    return (
      <Link
        key={mobile ? `mobile-${item.to}` : item.to}
        to={item.to}
        viewTransition
        className={mobile ? cn(navLinkClass, "w-full justify-start px-2 py-2 text-[11px]") : desktopLinkClass}
        activeProps={
          mobile
            ? {
                className: cn(navLinkClass, navLinkActiveClass, "w-full justify-start px-2 py-2 text-[11px]"),
                style: getNavLinkActiveStyle(item),
              }
            : { style: { color: activeColor, boxShadow: `inset 0 -2px ${activeColor}` } }
        }
        activeOptions={item.exact ? { ...navLinkActiveOptions, exact: true } : navLinkActiveOptions}
        onClick={onNavigate}
      >
        {mobile ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
        <span>{item.label}</span>
      </Link>
    );
  });
