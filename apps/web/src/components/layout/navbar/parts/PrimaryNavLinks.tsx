import { Link, useRouterState } from "@tanstack/react-router";
import {
  navLinkActiveOptions,
  type PrimaryNavItem,
} from "@/components/layout/navbar/navbar.constants";
import { isSectionActive, useSlidingMarker } from "@/components/layout/navbar/use-sliding-marker";

type PrimaryNavLinksProps = {
  items: PrimaryNavItem[];
};

// Flat kicker links (desktop); one underline slides to the current one in its film/TV colour.
const linkClass =
  "relative inline-flex h-14 items-center px-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-colors duration-300 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary";

export const PrimaryNavLinks = ({ items }: PrimaryNavLinksProps) => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeItem = items.find((item) => isSectionActive(pathname, item.to, item.exact)) ?? null;
  const { markerRef, register } = useSlidingMarker(activeItem?.to ?? null);

  return (
    <>
      {items.map((item) => (
        <Link
          key={item.to}
          ref={register(item.to)}
          to={item.to}
          viewTransition
          className={linkClass}
          activeProps={{ style: { color: item.activeColor ?? "var(--fg)" } }}
          activeOptions={item.exact ? { ...navLinkActiveOptions, exact: true } : navLinkActiveOptions}
        >
          {item.label}
        </Link>
      ))}
      <span
        ref={markerRef}
        aria-hidden
        data-testid="nav-marker"
        className="pointer-events-none absolute opacity-0 bottom-0 left-0 h-0.5 transition-[transform,width,background-color,opacity] duration-300 ease-in-out motion-reduce:transition-none"
        style={{ background: activeItem?.activeColor ?? "var(--fg)" }}
      />
    </>
  );
};
