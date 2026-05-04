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
};

export const PrimaryNavLinks = ({
  items,
  mobile = false,
  onNavigate,
}: PrimaryNavLinksProps) =>
  items.map((item) => {
    const Icon = item.icon;
    const sharedClassName = mobile
      ? cn(navLinkClass, "w-full justify-start px-2 py-2 text-[11px]")
      : navLinkClass;
    const sharedActiveClassName = mobile
      ? cn(
          navLinkClass,
          navLinkActiveClass,
          "w-full justify-start px-2 py-2 text-[11px]",
        )
      : cn(navLinkClass, navLinkActiveClass);

    return (
      <Link
        key={mobile ? `mobile-${item.to}` : item.to}
        to={item.to}
        viewTransition
        className={sharedClassName}
        activeProps={{
          className: sharedActiveClassName,
          style: getNavLinkActiveStyle(item),
        }}
        activeOptions={
          item.exact
            ? { ...navLinkActiveOptions, exact: true }
            : navLinkActiveOptions
        }
        onClick={onNavigate}
      >
        <Icon
          className={mobile ? "h-3.5 w-3.5 shrink-0" : "h-3 w-3 shrink-0"}
        />
        <span>{item.label}</span>
      </Link>
    );
  });
