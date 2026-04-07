import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Search, Settings, User, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrimaryNavLinks } from "@/components/layout/navbar/parts/PrimaryNavLinks";
import type { NavbarUser } from "@/components/layout/navbar/parts/types";
import {
  navLinkActiveClass,
  navLinkClass,
  type PrimaryNavItem,
} from "@/components/layout/navbar/navbar.constants";
import { cn } from "@/lib/utils";

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
      <nav className="mx-auto flex w-full max-w-400 flex-col gap-1 px-4 py-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex w-full items-center gap-2 border border-border/70 px-3 py-2 text-left font-mono text-[11px] text-foreground/80 transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Search className="h-3.5 w-3.5" />
          SEARCH
        </button>

        <PrimaryNavLinks items={visiblePrimaryNavItems} mobile onNavigate={onClose} />

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
              className={cn(navLinkClass, "w-full justify-start px-2 py-2 text-[11px]")}
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
              className={cn(navLinkClass, "w-full justify-start px-2 py-2 text-[11px]")}
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
