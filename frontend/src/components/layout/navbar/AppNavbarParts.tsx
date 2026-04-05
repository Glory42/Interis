import type { RefObject } from "react";
import { Link } from "@tanstack/react-router";
import {
  LogIn,
  LogOut,
  Search,
  Settings,
  Terminal,
  User,
  UserRound,
} from "lucide-react";
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
  <div className="shrink-0">
    <Link
      to="/"
      viewTransition
      className="group flex items-center gap-2 shrink-0"
    >
      <div className="flex h-6 w-6 items-center justify-center border border-primary/40 bg-primary/10 text-primary transition-all group-hover:border-primary">
        <Terminal className="h-3.5 w-3.5 text-current" />
      </div>
      <span className="font-mono text-[11px] font-bold tracking-widest text-foreground/80 transition-colors group-hover:text-foreground">
        NULL<span className="text-primary">://</span>LOG
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

type DesktopSearchButtonProps = {
  isSearchDialogOpen: boolean;
  onOpen: () => void;
};

export const DesktopSearchButton = ({
  isSearchDialogOpen,
  onOpen,
}: DesktopSearchButtonProps) => (
  <div className="relative hidden sm:flex items-center">
    <Search className="pointer-events-none relative z-10 ml-2 mr-[-20px] h-3 w-3 text-muted-foreground/70" />
    <input
      readOnly
      type="text"
      value=""
      onClick={onOpen}
      onFocus={onOpen}
      placeholder="search..."
      aria-haspopup="dialog"
      aria-expanded={isSearchDialogOpen}
      aria-label="Open cinema search"
      className="w-36 border border-border/70 bg-background/45 py-1.5 pr-3 pl-7 font-mono text-[11px] text-foreground/80 transition-colors placeholder:text-muted-foreground/60 focus:w-48 focus:border-border focus:outline-none"
      style={{ transition: "width 0.2s, border-color 0.2s" }}
    />
  </div>
);

type ProfileMenuProps = {
  user: NavbarUser;
  isOpen: boolean;
  isLogoutPending: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void | Promise<void>;
  menuRef: RefObject<HTMLDivElement | null>;
};

export const ProfileMenu = ({
  user,
  isOpen,
  isLogoutPending,
  onOpen,
  onToggle,
  onClose,
  onSignOut,
  menuRef,
}: ProfileMenuProps) => (
  <div
    ref={menuRef}
    className="relative"
    onMouseEnter={onOpen}
    onMouseLeave={onClose}
  >
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-all hover:text-foreground"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-label="Open profile menu"
    >
      <User className="h-3 w-3" />
      <span className="hidden sm:inline">PROFILE</span>
    </button>

    {isOpen ? (
      <div
        className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-44 border border-border/80 bg-popover/95 p-1 backdrop-blur-md animate-fade-up"
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
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="h-7 px-2.5 text-muted-foreground"
    >
      <Link to="/login" viewTransition>
        <LogIn className="h-3.5 w-3.5" />
        LOGIN
      </Link>
    </Button>
    <Button asChild size="sm" className="h-7 px-2.5">
      <Link to="/register" viewTransition>
        <UserRound className="h-3.5 w-3.5" />
        REGISTER
      </Link>
    </Button>
  </div>
);

type MobileMenuToggleProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export const MobileMenuToggle = ({
  isOpen,
  onToggle,
}: MobileMenuToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    className="border border-border/70 px-2 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:hidden"
    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
    aria-expanded={isOpen}
    aria-haspopup="menu"
  >
    MENU
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
    <div className="theme-navbar-panel border-t border-border/70 bg-background/95 md:hidden">
      <nav className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 px-4 py-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex w-full items-center gap-2 border border-border/70 px-3 py-2 text-left font-mono text-[11px] text-foreground/80 transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Search className="h-3.5 w-3.5" />
          SEARCH
        </button>

        <PrimaryNavLinks
          items={visiblePrimaryNavItems}
          mobile
          onNavigate={onClose}
        />

        {isUserLoading ? (
          <p className="px-2 py-2 font-mono text-[11px] text-muted-foreground">
            LOADING SESSION...
          </p>
        ) : null}

        {user ? (
          <>
            <Link
              to="/profile/$username"
              params={{ username: user.username }}
              className={cn(
                navLinkClass,
                "w-full justify-start px-2 py-2 text-[11px]",
              )}
              activeProps={{
                className: cn(
                  navLinkClass,
                  navLinkActiveClass,
                  "w-full justify-start px-2 py-2 text-[11px]",
                ),
              }}
              onClick={onClose}
              viewTransition
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>PROFILE</span>
            </Link>
            <Link
              to="/settings"
              className={cn(
                navLinkClass,
                "w-full justify-start px-2 py-2 text-[11px]",
              )}
              activeProps={{
                className: cn(
                  navLinkClass,
                  navLinkActiveClass,
                  "w-full justify-start px-2 py-2 text-[11px]",
                ),
              }}
              onClick={onClose}
              viewTransition
            >
              <Settings className="h-3.5 w-3.5 shrink-0" />
              <span>SETTINGS</span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              disabled={isLogoutPending}
              className="w-full justify-start px-2 py-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isLogoutPending ? "SIGNING OUT" : "SIGN OUT"}
            </Button>
          </>
        ) : null}

        {!isUserLoading && !user ? (
          <div className="mt-1 flex flex-col gap-2 border-t border-border/70 pt-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <Link to="/login" onClick={onClose} viewTransition>
                <LogIn className="h-3.5 w-3.5" />
                LOGIN
              </Link>
            </Button>
            <Button asChild size="sm" className="w-full justify-start ">
              <Link to="/register" onClick={onClose} viewTransition>
                <UserRound className="h-3.5 w-3.5" />
                REGISTER
              </Link>
            </Button>
          </div>
        ) : null}
      </nav>
    </div>
  );
};
