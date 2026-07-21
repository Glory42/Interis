import { Link } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState } from "react";
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

type IndicatorRect = { left: number; width: number };

const isItemActive = (item: PrimaryNavItem, pathname: string): boolean => {
  if (item.exact) {
    return pathname === item.to;
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

export const PrimaryNavLinks = ({
  items,
  mobile = false,
  onNavigate,
  pathname,
}: PrimaryNavLinksProps) => {
  const linkRefs = useRef<Partial<Record<string, HTMLAnchorElement>>>({});
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  const activeItem = pathname ? items.find((item) => isItemActive(item, pathname)) : undefined;

  useLayoutEffect(() => {
    if (mobile || !activeItem) {
      return;
    }

    const activeLink = linkRefs.current[activeItem.to];
    if (activeLink) {
      setIndicator({ left: activeLink.offsetLeft, width: activeLink.offsetWidth });
    }
  }, [mobile, activeItem]);

  const links = items.map((item) => {
    const Icon = item.icon;
    const sharedClassName = mobile
      ? cn(navLinkClass, "w-full justify-start px-2 py-2 text-[11px]")
      : cn(navLinkClass, "relative z-10");
    const sharedActiveClassName = mobile
      ? cn(
          navLinkClass,
          navLinkActiveClass,
          "w-full justify-start px-2 py-2 text-[11px]",
        )
      : cn(navLinkClass, "relative z-10 border-transparent");

    return (
      <Link
        key={mobile ? `mobile-${item.to}` : item.to}
        ref={(el) => {
          if (el && !mobile) {
            linkRefs.current[item.to] = el;
          }
        }}
        to={item.to}
        viewTransition
        className={sharedClassName}
        activeProps={{
          className: sharedActiveClassName,
          style: mobile ? getNavLinkActiveStyle(item) : { color: item.activeColor ?? "var(--foreground)" },
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

  if (mobile) {
    return links;
  }

  return (
    <>
      {indicator ? (
        <div
          className="absolute inset-y-0.5 border transition-all duration-300 ease-out"
          style={{
            left: indicator.left,
            width: indicator.width,
            borderColor: activeItem
              ? `color-mix(in srgb, ${activeItem.activeColor ?? "var(--foreground)"} 42%, transparent)`
              : "transparent",
            background: activeItem
              ? `color-mix(in srgb, ${activeItem.activeColor ?? "var(--foreground)"} 10%, transparent)`
              : "transparent",
          }}
        />
      ) : null}
      {links}
    </>
  );
};
