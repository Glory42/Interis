import type { RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { Grid3X3, LogIn, LogOut, Search, Settings, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  dropdownItemClass,
  navLinkActiveClass,
  navLinkActiveOptions,
  navLinkClass,
  type PrimaryNavItem,
} from "./navbar.constants";

type NavbarUser = {
  username: string;
};

type PrimaryNavLinksProps = {
  items: PrimaryNavItem[];
  mobile?: boolean;
  onNavigate?: () => void;
};

export const NavbarBrand = () => (
  <div className="min-w-0 shrink-0 mt-2.5">
    <Link
      to="/"
      viewTransition
      className="inline-flex min-w-0 shrink-0 items-center gap-2 text-primary"
    >
      <img
        src="/icon.svg"
        alt=""
        aria-hidden
        className="h-7.5 w-7.5 rounded-sm object-cover"
      />
      <span className="truncate text-lg font-bold uppercase italic text-primary">
        Arkheion
      </span>
    </Link>
  </div>
);

export const PrimaryNavLinks = ({
  items,
  mobile = false,
  onNavigate,
}: PrimaryNavLinksProps) =>
  items.map((item) => {
    const Icon = item.icon;
    const sharedClassName = mobile
      ? cn(navLinkClass, "w-full justify-start")
      : navLinkClass;
    const sharedActiveClassName = mobile
      ? cn(navLinkClass, navLinkActiveClass, "w-full justify-start")
      : cn(navLinkClass, navLinkActiveClass);

    return (
      <Link
        key={mobile ? `mobile-${item.to}` : item.to}
        to={item.to}
        viewTransition
        className={sharedClassName}
        activeProps={{
          className: sharedActiveClassName,
        }}
        activeOptions={
          item.exact
            ? { ...navLinkActiveOptions, exact: true }
            : navLinkActiveOptions
        }
        onClick={onNavigate}
      >
        <Icon className={mobile ? "h-4 w-4 shrink-0" : "h-3.75 w-3.75 shrink-0"} />
        <span>{item.label}</span>
      </Link>
    );
  });

type DesktopSearchButtonProps = {
  isSearchDialogOpen: boolean;
  onOpen: () => void;
};

export const DesktopSearchButton = ({
  isSearchDialogOpen,
  onOpen,
}: DesktopSearchButtonProps) => (
  <button
    type="button"
    onClick={onOpen}
    className="relative hidden w-44 items-center rounded-xl border border-border/70 bg-secondary/35 py-1.5 pl-8 pr-3 text-left text-xs text-muted-foreground transition-all duration-200 hover:border-border hover:bg-secondary/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:border-primary/40 sm:inline-flex"
    aria-haspopup="dialog"
    aria-expanded={isSearchDialogOpen}
    aria-label="Open cinema search"
  >
    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
    <span className="truncate">Search...</span>
  </button>
);

type ProfileMenuProps = {
  user: NavbarUser;
  profileImageUrl: string | null;
  profileInitial: string;
  isOpen: boolean;
  isLogoutPending: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void | Promise<void>;
  menuRef: RefObject<HTMLDivElement | null>;
};

export const ProfileMenu = ({
  user,
  profileImageUrl,
  profileInitial,
  isOpen,
  isLogoutPending,
  onToggle,
  onClose,
  onSignOut,
  menuRef,
}: ProfileMenuProps) => (
  <div ref={menuRef} className="relative">
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 rounded-full border border-border/70 bg-secondary/35 py-1 pl-1 pr-3 transition-all duration-200 hover:border-border hover:bg-secondary/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-label="Open profile menu"
    >
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt={`${user.username} avatar`}
          className="h-7 w-7 rounded-full border border-border/70 bg-muted object-cover"
        />
      ) : (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-secondary text-[11px] font-semibold text-secondary-foreground">
          {profileInitial}
        </span>
      )}
      <span className="hidden max-w-32 truncate text-xs font-medium text-foreground lg:inline">
        {user.username}
      </span>
    </button>

    {isOpen ? (
      <div
        className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 rounded-xl border border-border/70 bg-card/95 p-1.5 shadow-lg shadow-background/30 backdrop-blur-xl animate-fade-up"
        role="menu"
        aria-label="Profile options"
      >
        <Link
          to="/profile/$username"
          params={{ username: user.username }}
          viewTransition
          className={dropdownItemClass}
          onClick={onClose}
        >
          Profile
        </Link>
        <Link
          to="/settings"
          viewTransition
          className={dropdownItemClass}
          onClick={onClose}
        >
          Settings
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          disabled={isLogoutPending}
          className={dropdownItemClass}
        >
          {isLogoutPending ? "Signing out" : "Sign out"}
        </button>
      </div>
    ) : null}
  </div>
);

export const DesktopGuestActions = () => (
  <div className="hidden items-center gap-1 md:flex">
    <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl px-3">
      <Link to="/login" viewTransition>
        <LogIn className="h-4 w-4" />
        Login
      </Link>
    </Button>
    <Button asChild size="sm" className="h-8 rounded-xl px-3">
      <Link to="/register" viewTransition>
        <UserRound className="h-4 w-4" />
        Register
      </Link>
    </Button>
  </div>
);

type MobileMenuToggleProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export const MobileMenuToggle = ({ isOpen, onToggle }: MobileMenuToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    className="inline-flex items-center justify-center rounded-lg border border-border/70 p-1.5 text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/60 md:hidden"
    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
    aria-expanded={isOpen}
    aria-haspopup="menu"
  >
    <Grid3X3 className="h-4 w-4" />
  </button>
);

type MobileMenuProps = {
  isOpen: boolean;
  isUserLoading: boolean;
  user: NavbarUser | null;
  visiblePrimaryNavItems: PrimaryNavItem[];
  isLogoutPending: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  onSignOut: () => void | Promise<void>;
};

export const MobileMenu = ({
  isOpen,
  isUserLoading,
  user,
  visiblePrimaryNavItems,
  isLogoutPending,
  onClose,
  onOpenSearch,
  onSignOut,
}: MobileMenuProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="border-t border-border/60 bg-background/92 backdrop-blur-2xl md:hidden">
      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex w-full items-center gap-2 rounded-xl border border-border/70 bg-background/35 px-3.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Search className="h-4 w-4" />
          Search cinema
        </button>

        <PrimaryNavLinks
          items={visiblePrimaryNavItems}
          mobile
          onNavigate={onClose}
        />

        {isUserLoading ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">Loading session...</p>
        ) : null}

        {user ? (
          <>
            <Link
              to="/profile/$username"
              params={{ username: user.username }}
              className={cn(navLinkClass, "w-full justify-start")}
              activeProps={{
                className: cn(navLinkClass, navLinkActiveClass, "w-full justify-start"),
              }}
              onClick={onClose}
              viewTransition
            >
              <UserRound className="h-4 w-4 shrink-0" />
              <span>Profile</span>
            </Link>
            <Link
              to="/settings"
              className={cn(navLinkClass, "w-full justify-start")}
              activeProps={{
                className: cn(navLinkClass, navLinkActiveClass, "w-full justify-start"),
              }}
              onClick={onClose}
              viewTransition
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              disabled={isLogoutPending}
              className="w-full justify-start rounded-xl text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              {isLogoutPending ? "Signing out" : "Sign out"}
            </Button>
          </>
        ) : null}

        {!isUserLoading && !user ? (
          <div className="mt-1 flex flex-col gap-2 border-t border-border/60 pt-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-start rounded-xl"
            >
              <Link to="/login" onClick={onClose} viewTransition>
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
            <Button asChild size="sm" className="w-full justify-start rounded-xl">
              <Link to="/register" onClick={onClose} viewTransition>
                <UserRound className="h-4 w-4" />
                Register
              </Link>
            </Button>
          </div>
        ) : null}
      </nav>
    </div>
  );
};
